import hashlib
import json
import os
from pathlib import Path

from eth_account import Account
from web3 import Web3
from web3.exceptions import ContractLogicError, TimeExhausted


class BlockchainConfigError(RuntimeError):
    pass


def _normalize_private_key(private_key):
    key = str(private_key or "").strip()
    if not key:
        raise BlockchainConfigError("BLOCKCHAIN_SIGNER_PRIVATE_KEY is required.")
    if key.startswith("0x"):
        return key
    return f"0x{key}"


def _normalize_aadhar_number(aadhar_number):
    value = str(aadhar_number or "").strip()
    if not value:
        raise ValueError("Aadhaar number is required.")
    if not value.isdigit() or len(value) != 12:
        raise ValueError("Aadhaar number must be exactly 12 digits.")
    return value


def build_borrower_hash(aadhar_number):
    normalized = _normalize_aadhar_number(aadhar_number)
    salt = os.environ.get("BLOCKCHAIN_HASH_SALT", "")
    payload = f"{salt}:{normalized}".encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def build_loan_hash(application_id):
    normalized = str(application_id or "").strip()
    if not normalized:
        raise ValueError("Application id is required to build loan hash.")
    payload = f"loan:{normalized}".encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def _load_contract_abi():
    raw_abi = os.environ.get("BLOCKCHAIN_CONTRACT_ABI", "").strip()
    if raw_abi:
        return json.loads(raw_abi)

    default_path = Path(__file__).resolve().parent / "loan_contract_abi.json"
    abi_path = Path(os.environ.get("BLOCKCHAIN_CONTRACT_ABI_PATH", str(default_path)))
    if not abi_path.exists():
        raise BlockchainConfigError(f"Contract ABI file not found at {abi_path}.")
    return json.loads(abi_path.read_text(encoding="utf-8"))


class LoanBlockchainClient:
    def __init__(self):
        rpc_url = os.environ.get("BLOCKCHAIN_RPC_URL", "").strip()
        contract_address = os.environ.get("BLOCKCHAIN_CONTRACT_ADDRESS", "").strip()
        signer_private_key = _normalize_private_key(os.environ.get("BLOCKCHAIN_SIGNER_PRIVATE_KEY", ""))
        signer_address = os.environ.get("BLOCKCHAIN_SIGNER_ADDRESS", "").strip().lower()

        if not rpc_url:
            raise BlockchainConfigError("BLOCKCHAIN_RPC_URL is required.")
        if not contract_address:
            raise BlockchainConfigError("BLOCKCHAIN_CONTRACT_ADDRESS is required.")

        self.network_name = os.environ.get("BLOCKCHAIN_NETWORK_NAME", "sepolia").strip() or "sepolia"
        self.web3 = Web3(Web3.HTTPProvider(rpc_url))
        if not self.web3.is_connected():
            raise BlockchainConfigError("Unable to connect to blockchain RPC endpoint.")

        self.account = Account.from_key(signer_private_key)
        if signer_address and self.account.address.lower() != signer_address:
            raise BlockchainConfigError("BLOCKCHAIN_SIGNER_ADDRESS does not match BLOCKCHAIN_SIGNER_PRIVATE_KEY.")

        contract_abi = _load_contract_abi()
        self.contract = self.web3.eth.contract(
            address=self.web3.to_checksum_address(contract_address),
            abi=contract_abi,
        )

    def get_borrower_loans(self, borrower_hash):
        try:
            return self.contract.functions.getBorrowerLoans(borrower_hash).call()
        except (ContractLogicError, ValueError) as error:
            raise RuntimeError("Unable to read borrower loans from contract.") from error

    def get_loan_count(self, borrower_hash):
        try:
            return int(self.contract.functions.getLoanCount(borrower_hash).call())
        except (ContractLogicError, ValueError) as error:
            raise RuntimeError("Unable to read borrower loan count from contract.") from error

    def is_high_risk(self, borrower_hash):
        try:
            return bool(self.contract.functions.isHighRisk(borrower_hash).call())
        except (ContractLogicError, ValueError) as error:
            raise RuntimeError("Unable to read borrower risk status from contract.") from error

    def register_loan(self, borrower_hash, loan_hash, lender_id, amount, risk_score, fraud_status, ai_reason):
        try:
            nonce = self.web3.eth.get_transaction_count(self.account.address)
            fn = self.contract.functions.registerLoan(
                borrower_hash,
                loan_hash,
                lender_id,
                int(amount),
                int(risk_score),
                int(fraud_status),
                ai_reason,
            )
            gas_estimate = fn.estimate_gas({"from": self.account.address})
            transaction = fn.build_transaction(
                {
                    "from": self.account.address,
                    "nonce": nonce,
                    "chainId": self.web3.eth.chain_id,
                    "gas": gas_estimate,
                    "gasPrice": self.web3.eth.gas_price,
                }
            )

            signed_tx = self.web3.eth.account.sign_transaction(transaction, private_key=self.account.key)
            tx_hash = self.web3.eth.send_raw_transaction(signed_tx.raw_transaction)
            receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash, timeout=180)
        except (ContractLogicError, TimeExhausted, ValueError) as error:
            raise RuntimeError("Unable to register loan on blockchain.") from error

        if receipt.status != 1:
            raise RuntimeError("Blockchain transaction failed.")
        return {
            "tx_hash": tx_hash.hex(),
            "chain_id": self.web3.eth.chain_id,
            "network": self.network_name,
        }


_CLIENT = None


def get_blockchain_client():
    global _CLIENT
    if _CLIENT is None:
        _CLIENT = LoanBlockchainClient()
    return _CLIENT

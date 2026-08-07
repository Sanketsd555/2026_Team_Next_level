import os
import re

import pytesseract
from PIL import Image

from .assistant import _ollama, CHAT_MODEL

pytesseract.pytesseract.tesseract_cmd = os.environ.get(
    "TESSERACT_CMD", r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)

_PAN_RE = re.compile(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b")
_AADHAAR_RE = re.compile(r"\b[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}\b")
_VALID_PAN_TYPES = {"A", "B", "C", "F", "G", "H", "L", "J", "P", "T", "E"}


def _verhoeff(number):
    d = (
        (0, 1, 2, 3, 4, 5, 6, 7, 8, 9),
        (1, 2, 3, 4, 0, 6, 7, 8, 9, 5),
        (2, 3, 4, 0, 1, 7, 8, 9, 5, 6),
        (3, 4, 0, 1, 2, 8, 9, 5, 6, 7),
        (4, 0, 1, 2, 3, 9, 5, 6, 7, 8),
        (5, 9, 8, 7, 6, 0, 4, 3, 2, 1),
        (6, 5, 9, 8, 7, 1, 0, 4, 3, 2),
        (7, 6, 5, 9, 8, 2, 1, 0, 4, 3),
        (8, 7, 6, 5, 9, 3, 2, 1, 0, 4),
        (9, 8, 7, 6, 5, 4, 3, 2, 1, 0),
    )
    p = (
        (0, 1, 2, 3, 4, 5, 6, 7, 8, 9),
        (1, 5, 7, 6, 2, 8, 3, 0, 9, 4),
        (5, 8, 0, 3, 7, 9, 6, 1, 4, 2),
        (8, 9, 1, 6, 0, 4, 3, 5, 2, 7),
        (9, 4, 5, 3, 1, 2, 6, 8, 7, 0),
        (4, 2, 8, 6, 5, 7, 3, 9, 0, 1),
        (2, 7, 9, 3, 8, 0, 6, 4, 1, 5),
        (7, 0, 4, 6, 9, 1, 3, 2, 5, 8),
    )
    inv = (0, 4, 3, 2, 1, 5, 6, 7, 8, 9)
    digits = [int(char) for char in str(number)]
    checksum = 0
    for index, digit in enumerate(reversed(digits)):
        checksum = d[checksum][p[(index + 1) % 8][digit]]
    return inv[checksum] == 0


def verify_pan(number):
    checks = []
    if not re.fullmatch(r"[A-Z]{5}[0-9]{4}[A-Z]", number):
        checks.append({"name": "Format", "passed": False, "detail": "PAN must be 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)."})
    else:
        checks.append({"name": "Format", "passed": True, "detail": "PAN matches the standard format."})
        if number[3] in _VALID_PAN_TYPES:
            checks.append({"name": "Category letter", "passed": True, "detail": f"Category letter '{number[3]}' is a valid PAN type."})
        else:
            checks.append({"name": "Category letter", "passed": False, "detail": f"Category letter '{number[3]}' is not a valid PAN type."})
        if number[4].isalpha():
            checks.append({"name": "Surname initial", "passed": True, "detail": f"Letter '{number[4]}' represents the applicant's name initial."})
    return {"valid": all(check["passed"] for check in checks), "checks": checks}


def verify_aadhaar(number):
    digits = re.sub(r"\s", "", number)
    checks = []
    if re.fullmatch(r"[2-9][0-9]{11}", digits):
        checks.append({"name": "Format", "passed": True, "detail": "Aadhaar has 12 digits and starts with 2-9."})
    else:
        checks.append({"name": "Format", "passed": False, "detail": "Aadhaar must be exactly 12 digits starting with 2-9."})
    if len(digits) == 12 and digits.isdigit():
        if _verhoeff(digits):
            checks.append({"name": "Verhoeff checksum", "passed": True, "detail": "Checksum is mathematically valid."})
        else:
            checks.append({"name": "Verhoeff checksum", "passed": False, "detail": "Checksum check failed — number may be invalid."})
    return {"valid": all(check["passed"] for check in checks), "checks": checks}


def _ocr(image):
    text = pytesseract.image_to_string(image)
    data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
    confidences = [
        int(confidence)
        for word, confidence in zip(data.get("text", []), data.get("conf", []))
        if str(word).strip() and int(confidence) > 0
    ]
    confidence = round(sum(confidences) / len(confidences), 1) if confidences else 0.0
    return text, confidence


def verify_document(upload, doc_type):
    try:
        image = Image.open(upload)
        image = image.convert("RGB")
        text, confidence = _ocr(image)
    except Exception as error:
        return {
            "document_type": doc_type,
            "verified": False,
            "error": f"Could not read the image: {error}",
        }

    normalized = text.upper()
    result = {"document_type": doc_type, "ocr_confidence": confidence}

    if doc_type == "pan":
        match = _PAN_RE.search(normalized)
        if not match:
            result.update(
                {
                    "verified": False,
                    "extracted_number": None,
                    "checks": [{"name": "OCR", "passed": False, "detail": "No PAN number found in the document image."}],
                }
            )
        else:
            number = match.group(0)
            verification = verify_pan(number)
            result.update({"verified": verification["valid"], "extracted_number": number, "checks": verification["checks"]})
    elif doc_type == "aadhaar":
        match = _AADHAAR_RE.search(normalized)
        if not match:
            result.update(
                {
                    "verified": False,
                    "extracted_number": None,
                    "checks": [{"name": "OCR", "passed": False, "detail": "No Aadhaar number found in the document image."}],
                }
            )
        else:
            number = re.sub(r"\s", "", match.group(0))
            verification = verify_aadhaar(number)
            result.update({"verified": verification["valid"], "extracted_number": number, "checks": verification["checks"]})
    else:
        result.update({"verified": False, "error": "Unsupported document type."})
        return result

    snippet = " ".join(normalized.split())[:200]
    result["ocr_snippet"] = snippet

    try:
        verdict = "PASS" if result.get("verified") else "FAIL"
        prompt = (
            "You are a KYC document verification officer. OCR extracted this text from a user document "
            f"({doc_type.upper()}):\n'{snippet}'\n\n"
            f"The checks say the extracted number is {verdict}. Give a one-line verdict on whether this "
            "document appears valid, mentioning any red flags."
        )
        ai_reason = _ollama(
            "/api/generate",
            {
                "model": CHAT_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": 0.2, "num_predict": 80},
            },
        ).get("response", "").strip()
        if ai_reason:
            result["ai_review"] = ai_reason
    except Exception:
        pass

    return result

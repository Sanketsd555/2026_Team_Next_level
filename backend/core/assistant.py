import json
import os
import re
import urllib.request

from .mongomodels import LoanAdvertisement, LoanApplication

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")
EMBED_MODEL = os.environ.get("OLLAMA_EMBED_MODEL", "nomic-embed-text")
CHAT_MODEL = os.environ.get("OLLAMA_CHAT_MODEL", "mistral:7b")

_HINT = (
    "Try asking about loan eligibility, required documents, EMI calculation, "
    "loan status, or a product like 'home loan' or 'gold loan'."
)

FAQ_DOCS = [
    {
        "title": "Loan eligibility",
        "content": (
            "To apply for a loan on LoanFlow you need a valid PAN card, a 12-digit Aadhaar card, "
            "a bank account with IFSC code, a 10-digit mobile number and an email address. "
            "You should be 18 or older and either salaried or self employed."
        ),
    },
    {
        "title": "Required documents",
        "content": (
            "Keep ready your PAN number, 12-digit Aadhaar number, bank account number with IFSC code, "
            "mobile number and email. For larger loans banks may also ask for income proof such as "
            "salary slips or business statements."
        ),
    },
    {
        "title": "How to apply",
        "content": (
            "Open the User dashboard, choose a bank from the application form, fill in your details, "
            "amount, purpose and tenure, then submit. The bank reviews your application and you can "
            "track its status in the My applications section."
        ),
    },
    {
        "title": "EMI and interest rates",
        "content": (
            "EMI is the equated monthly installment you pay every month. It depends on the loan amount, "
            "the APR and the tenure. On LoanFlow APR ranges from about 8.75% to 11.50%; home loans carry "
            "the lowest rate, followed by gold, personal and business loans."
        ),
    },
    {
        "title": "Approval time and loan status",
        "content": (
            "After you submit, the bank reviews the application. Status stays pending while it is being "
            "reviewed and becomes approved or rejected once the bank decides. You can always check the "
            "status of your applications in the user dashboard."
        ),
    },
    {
        "title": "Loan amounts available",
        "content": (
            "Each product has a minimum and maximum amount: quick personal loan from Rs 10,000 to 2.5 lakh, "
            "home loan from 1 lakh to 10 lakh, two wheeler loan from 20,000 to 2 lakh, business loan from "
            "50,000 to 5 lakh, and gold loan from 10,000 to 5 lakh. APR differs by product."
        ),
    },
]

_TITLE_PATTERNS = [
    (r"(\d+)\s*(?:months?|month)", 1),
    (r"(\d+)\s*(?:years?|yrs?)", 12),
]

_AMOUNT_PATTERNS = [
    (r"(?:₹|rs\.?|inr)\s*([\d,]+)", 1),
    (r"([\d,]+)\s*(?:lakh|lacs?|lakhs?)", 100000),
    (r"([\d,]+)\s*(?:crores?)", 10000000),
    (r"([\d,]+)\s*(?:thousand)", 1000),
]


def _ollama(path, payload):
    request = urllib.request.Request(
        f"{OLLAMA_URL}{path}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=120) as response:
        return json.loads(response.read().decode("utf-8"))


def _embed(texts):
    vectors = []
    for text in texts:
        result = _ollama("/api/embed", {"model": EMBED_MODEL, "input": text})
        vectors.append(result["embeddings"][0])
    return vectors


def _cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = sum(x * x for x in a) ** 0.5 or 1.0
    norm_b = sum(x * x for x in b) ** 0.5 or 1.0
    return dot / (norm_a * norm_b)


def _build_corpus():
    docs = []
    for faq in FAQ_DOCS:
        docs.append({"title": faq["title"], "type": "guide", "text": faq["content"]})
    for ad in LoanAdvertisement.objects(is_active=True):
        docs.append(
            {
                "title": ad.title,
                "type": "ad",
                "text": (
                    f"{ad.title} by {ad.bank_name}. {ad.description} "
                    f"APR is {ad.apr} percent and the amount ranges from "
                    f"{ad.min_amount} to {ad.max_amount}."
                ),
                "ad": {
                    "title": ad.title,
                    "bank_name": ad.bank_name,
                    "description": ad.description,
                    "apr": ad.apr,
                    "min_amount": ad.min_amount,
                    "max_amount": ad.max_amount,
                },
            }
        )
    return docs


_EMBEDDING_CACHE = {}


def _retrieve(query, docs, top_k=3):
    try:
        query_embedding = _embed([query])[0]
        cached = _EMBEDDING_CACHE.get("docs")
        if not cached or cached[0] != [doc["text"] for doc in docs]:
            vectors = _embed([doc["text"] for doc in docs])
            _EMBEDDING_CACHE["docs"] = ([doc["text"] for doc in docs], vectors)
        else:
            vectors = cached[1]
        ranked = sorted(
            (i for i in range(len(docs))),
            key=lambda i: _cosine(query_embedding, vectors[i]),
            reverse=True,
        )
        best_score = _cosine(query_embedding, vectors[ranked[0]])
        matches = []
        for i in ranked[:top_k]:
            score = _cosine(query_embedding, vectors[i])
            if best_score <= 0.35:
                continue
            if score >= best_score * 0.75:
                matches.append(docs[i])
        return matches
    except Exception:
        return _keyword_fallback(query, docs, top_k)


def _keyword_fallback(query, docs, top_k=3):
    tokens = {word for word in re.findall(r"[a-zA-Z0-9]+", query.lower()) if len(word) > 2}
    if not tokens:
        return []
    scored = []
    for doc in docs:
        words = set(re.findall(r"[a-zA-Z0-9]+", doc["text"].lower()))
        overlap = len(tokens & words)
        if overlap:
            scored.append((overlap, doc))
    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [doc for _, doc in scored[:top_k]]


def _generate(prompt):
    result = _ollama(
        "/api/generate",
        {
            "model": CHAT_MODEL,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": 0.2, "num_predict": 350},
        },
    )
    return result.get("response", "").strip()


def _parse_amount(text):
    lowered = text.lower()
    best = None
    for pattern, multiplier in _AMOUNT_PATTERNS:
        match = re.search(pattern, lowered)
        if match:
            value = float(match.group(1).replace(",", "")) * multiplier
            if best is None or value > best:
                best = value
    if best is None:
        match = re.search(r"([\d,]{4,})", text)
        if match:
            best = float(match.group(1).replace(",", ""))
    return best


def _parse_tenure(text):
    lowered = text.lower()
    for pattern, multiplier in _TITLE_PATTERNS:
        match = re.search(pattern, lowered)
        if match:
            return int(match.group(1)) * multiplier
    return None


def compute_emi(principal, annual_rate, months):
    monthly_rate = annual_rate / 100.0 / 12.0
    if monthly_rate == 0:
        return principal / months if months else 0.0
    factor = (1 + monthly_rate) ** months
    return principal * monthly_rate * factor / (factor - 1)


def _sources_for(docs):
    sources = []
    for doc in docs:
        if doc["type"] == "ad":
            sources.append(
                {
                    "type": "ad",
                    "title": doc["ad"]["title"],
                    "bank_name": doc["ad"]["bank_name"],
                    "apr": doc["ad"]["apr"],
                    "min_amount": doc["ad"]["min_amount"],
                    "max_amount": doc["ad"]["max_amount"],
                }
            )
        else:
            sources.append({"type": "guide", "title": doc["title"]})
    return sources


def _context_text(docs):
    lines = []
    for index, doc in enumerate(docs, start=1):
        lines.append(f"[{index}] {doc['title']}\n{doc['text']}")
    return "\n\n".join(lines)


def _emi_reply(query, docs):
    amount = _parse_amount(query)
    tenure = _parse_tenure(query) or 12
    aprs = [doc["ad"]["apr"] for doc in docs if doc["type"] == "ad"]
    if amount:
        apr = min(aprs) if aprs else 10.0
        emi = compute_emi(amount, apr, tenure)
        total = emi * tenure
        context = _context_text(docs)
        prompt = (
            "You are a helpful loan assistant for LoanFlow. Answer in plain text, keep it short.\n"
            f"Loan ads on the platform:\n{context}\n\n"
            f"Calculate and explain the EMI for a loan of Rs {amount:,.0f} at {apr:.2f}% APR over "
            f"{tenure} months. The exact monthly EMI is Rs {emi:,.0f} and total repayment is "
            f"Rs {total:,.0f}. Present the calculation clearly to the user."
        )
        fallback = (
            f"EMI estimate for {query}:\n"
            f"• Monthly EMI ≈ ₹{emi:,.0f}\n"
            f"• Total repayment ≈ ₹{total:,.0f} (interest ≈ ₹{total - amount:,.0f})\n"
            f"(at {apr:.2f}% APR over {tenure} months — final rate depends on the bank)"
        )
        try:
            return _generate(prompt) or fallback, _sources_for(docs[:2])
        except Exception:
            return fallback, _sources_for(docs[:2])
    try:
        context = _context_text(docs)
        prompt = (
            "You are a helpful loan assistant for LoanFlow. Keep it short and friendly.\n"
            f"Available loan products:\n{context}\n\n"
            "The user asked about EMI but did not give an amount or tenure. Tell them how EMI works "
            "and ask them to provide the amount and tenure, e.g. 'EMI for 500000 over 36 months'."
        )
        reply = _generate(prompt)
        if reply:
            return reply, _sources_for(docs[:2])
    except Exception:
        pass
    return (
        "I can estimate your EMI. Tell me the amount and tenure, e.g. "
        "'EMI for ₹5,00,000 over 36 months'.",
        _sources_for(docs[:2]),
    )


def _status_reply(username):
    applications = list(
        LoanApplication.objects(applicant_username=username).order_by("-created_at")
    )
    if not applications:
        return (
            "You have no loan applications yet. Open the User dashboard, choose a bank "
            "and submit an application to get started.",
            [],
        )
    lines = [
        f"• {app.purpose or 'Loan'} — Rs {app.amount:,.0f} with {app.bank_organization} → {app.status.upper()}"
        for app in applications
    ]
    context = "\n".join(lines)
    prompt = (
        "You are a helpful loan assistant for LoanFlow. Answer in plain text, keep it short.\n"
        f"The user's loan applications:\n{context}\n\n"
        "Summarize the status of the user's loan applications in a friendly way and mention "
        "next steps for any pending ones."
    )
    fallback = "Here is the status of your LoanFlow applications:\n" + context
    try:
        return _generate(prompt) or fallback, []
    except Exception:
        return fallback, []


def _rag_reply(query, docs):
    if not docs:
        return (
            "I could not find anything that matches your question on LoanFlow. " + _HINT,
            [],
        )
    context = _context_text(docs)
    prompt = (
        "You are a helpful loan assistant for LoanFlow. Answer ONLY using the provided context. "
        "If the context does not contain the answer, say you don't know. Be concise, friendly "
        "and answer in plain text. Use exact figures from the context when you mention rates or amounts.\n\n"
        f"Context:\n{context}\n\n"
        f"Question: {query}\n\n"
        "Answer:"
    )
    fallback = docs[0]["text"]
    try:
        return _generate(prompt) or fallback, _sources_for(docs)
    except Exception:
        return fallback, _sources_for(docs)


def answer_question(message, username):
    query = message.strip()
    if not query:
        return {"reply": f"Please type a question. {_HINT}", "sources": []}

    docs = _build_corpus()
    lowered = query.lower()

    if any(word in lowered for word in ("emi", "installment", "monthly payment", "repay")):
        reply, sources = _emi_reply(query, docs)
        return {"reply": reply, "sources": sources}

    if any(
        word in lowered
        for word in ("status", "track", "approval", "approved", "rejected", "pending", "my application")
    ):
        reply, sources = _status_reply(username)
        return {"reply": reply, "sources": sources}

    matched = _retrieve(query, docs)
    reply, sources = _rag_reply(query, matched)
    return {"reply": reply, "sources": sources}

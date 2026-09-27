from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Literal


@dataclass(frozen=True)
class Transaction:
    id: str
    merchant: str
    descriptor: str
    amount: float
    status: str
    category: str
    scenario: Literal["recurring", "reverted_duplicate", "unknown"]
    canonical_merchant: str | None = None
    location: str | None = None
    history_count: int = 0


TRANSACTIONS = {
    "tx-spotify": Transaction(
        id="tx-spotify", merchant="ABC*DIGITAL LUX", descriptor="ABC*DIGITAL LUX",
        amount=47.82, status="Completed", category="Entertainment", scenario="recurring",
        canonical_merchant="Spotify", history_count=3,
    ),
    "tx-hotel": Transaction(
        id="tx-hotel", merchant="HOTEL PARIS", descriptor="HOTEL PARIS 08",
        amount=92.40, status="Completed", category="Travel", scenario="unknown",
        location="Paris, FR",
    ),
    "tx-duplicate": Transaction(
        id="tx-duplicate", merchant="Brew House", descriptor="BREW HOUSE LDN",
        amount=6.80, status="Completed", category="Restaurants", scenario="reverted_duplicate",
        canonical_merchant="Brew House",
    ),
}


def _tool(name: str, label: str, duration_ms: int, result: str) -> dict:
    return {"name": name, "label": label, "durationMs": duration_ms, "result": result}


def investigate(transaction_id: str) -> dict:
    tx = TRANSACTIONS.get(transaction_id)
    if tx is None:
        raise KeyError(transaction_id)

    common = [
        _tool("get_transaction", "Read payment details", 48, f"{tx.status} · {tx.category}"),
        _tool("resolve_merchant", "Identify the merchant", 116, tx.canonical_merchant or "No confident match"),
        _tool("get_transaction_history", "Check your payment history", 72, f"{tx.history_count} relevant payments"),
    ]

    if tx.scenario == "unknown":
        tools = common + [_tool("retrieve_payment_policy", "Review card security guidance", 94, "Card payment security · v3.2")]
        result = {
            "outcome": "insufficient_evidence",
            "eyebrow": "Merchant not identified",
            "title": "We can’t confidently explain this payment",
            "explanation": "We found no previous payments to this merchant and could not verify the business behind the statement name.",
            "confidence": 0.24,
            "confidenceLabel": "Low confidence",
            "nextAction": "ask_user",
            "evidence": [
                {"label": "Previous payments", "value": "None found", "icon": "time"},
                {"label": "Merchant identity", "value": "Unverified", "icon": "storefront"},
                {"label": "Payment location", "value": tx.location or "Unavailable", "icon": "location"},
            ],
            "policy": "When a card payment is not recognised, secure the card first. A dispute can then be opened after the payment completes.",
        }
    elif tx.scenario == "reverted_duplicate":
        tools = common + [_tool("get_related_transactions", "Check related payments", 61, "1 reversed authorisation")]
        result = {
            "outcome": "reverted_duplicate",
            "eyebrow": "No duplicate charge found",
            "title": "One payment was already reversed",
            "explanation": "Two entries were created, but only one completed. The other was reversed and will not be collected again.",
            "confidence": 0.98,
            "confidenceLabel": "Very strong match",
            "nextAction": "recognize",
            "evidence": [
                {"label": "Completed payment", "value": "€6.80", "icon": "checkmark-circle"},
                {"label": "Reversed authorisation", "value": "€6.80", "icon": "arrow-undo-circle"},
                {"label": "Amount charged", "value": "€6.80 total", "icon": "receipt"},
            ],
            "policy": "Reverted card payments are released automatically. Some banks can take up to 7 days to remove the authorisation.",
        }
    else:
        tools = common + [_tool("detect_recurring_pattern", "Look for a recurring pattern", 39, "Monthly pattern detected")]
        result = {
            "outcome": "recognized_pattern",
            "eyebrow": "Recurring pattern found",
            "title": "This looks like a monthly subscription",
            "explanation": f"The amount and date match {tx.history_count} earlier payments. The statement name is linked to {tx.canonical_merchant}.",
            "confidence": 0.94,
            "confidenceLabel": "Strong match",
            "nextAction": "recognize",
            "evidence": [
                {"label": "Merchant match", "value": tx.canonical_merchant or tx.merchant, "icon": "storefront"},
                {"label": "Previous payments", "value": f"{tx.history_count} found", "icon": "time"},
                {"label": "Payment pattern", "value": "About every 30 days", "icon": "repeat"},
            ],
            "policy": "Subscription payments may use a billing descriptor that differs from the brand customers recognise.",
        }

    result["tools"] = tools
    result["totalLatencyMs"] = sum(tool["durationMs"] for tool in tools)
    return result


def list_transactions() -> list[dict]:
    return [asdict(transaction) for transaction in TRANSACTIONS.values()]


def run_evaluations() -> list[dict]:
    checks = [
        ("EV-01", investigate("tx-spotify")["outcome"] == "recognized_pattern"),
        ("EV-02", investigate("tx-hotel")["confidence"] < 0.5),
        ("EV-03", investigate("tx-duplicate")["outcome"] == "reverted_duplicate"),
        ("EV-04", investigate("tx-hotel")["nextAction"] == "ask_user"),
        ("EV-05", investigate("tx-hotel")["evidence"][2]["value"] == "Paris, FR"),
    ]
    return [{"id": case_id, "passed": passed} for case_id, passed in checks]

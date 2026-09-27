from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from engine import investigate, list_transactions, run_evaluations

app = FastAPI(
    title="Trace Investigation API",
    version="1.0.0",
    description="Typed, read-only investigation service for the Trace portfolio demo.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8081", "http://localhost:19006"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "trace-investigation-api", "mode": "synthetic"}


@app.get("/v1/transactions")
def transactions() -> dict:
    return {"data": list_transactions()}


@app.post("/v1/investigations/{transaction_id}")
def create_investigation(transaction_id: str) -> dict:
    try:
        return {"data": investigate(transaction_id), "source": "service"}
    except KeyError as error:
        raise HTTPException(status_code=404, detail="Transaction not found") from error


@app.get("/v1/evaluations")
def evaluations() -> dict:
    results = run_evaluations()
    return {"data": results, "passed": sum(item["passed"] for item in results), "total": len(results)}

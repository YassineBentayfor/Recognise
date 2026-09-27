# Trace Investigation API

This service mirrors the typed on-device investigation engine and makes the production boundary executable.

```bash
cd backend
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt
.venv/Scripts/uvicorn main:app --reload --port 8000
```

Open `http://localhost:8000/docs` for the generated API explorer.

Run the dependency-free engine tests with:

```bash
cd backend
python -m unittest -v test_engine.py
```

Endpoints:

- `GET /health`
- `GET /v1/transactions`
- `POST /v1/investigations/{transaction_id}`
- `GET /v1/evaluations`

The service is read-only by design. Card changes and dispute submission belong to separately authenticated action services with explicit user confirmation.

# Unrecognised Payment Resolution — Revolut product concept

This is an independent, mobile-first product concept showing how unfamiliar-card-payment resolution could fit natively inside the existing Revolut app. It reproduces the host experience around accounts, search, product navigation, transactions, card controls, and support before introducing the new functionality.

The feature deliberately does **not** appear as a general-purpose banking chatbot or a separate AI product. It begins inside the existing “Help with this payment” section, uses structured evidence, admits uncertainty, and cannot take a consequential action without explicit confirmation.

This prototype is not affiliated with or endorsed by Revolut.

## The product problem

Bank statements often expose legal or processor descriptors rather than recognisable brand names. A customer who sees `ABC*DIGITAL LUX` may search the web, freeze a card unnecessarily, open a false dispute, or contact support.

The feature reduces the time between “I don’t recognise this” and a safe resolution. It answers three questions:

1. What evidence is available?
2. What can we conclude without guessing?
3. What is the safest user-controlled next step?

## Try the three flagship scenarios

| Transaction | Expected behaviour | Product point |
| --- | --- | --- |
| `ABC*DIGITAL LUX` | Finds a monthly pattern and a likely Spotify match | Evidence beats a generated assertion |
| `BREW HOUSE LDN` | Finds one completed and one reverted authorisation | Avoids a false duplicate-payment dispute |
| `HOTEL PARIS 08` | Admits the merchant cannot be verified and offers a guarded security flow | Uncertainty and consequential-action gating |

Internal evaluations, tool traces, latency, and event telemetry are available through the backend and test suite only. They are deliberately absent from the customer interface.

## Run locally

Prerequisites: Node.js 20+ and npm.

```bash
npm install
npm run web
```

For iOS or Android, scan the Expo development QR code or run:

```bash
npm run ios
npm run android
```

## Deploy to Vercel

The repository includes `vercel.json`, so Vercel can build the Expo web app and preserve direct links to client-side routes.

1. Push the repository to GitHub.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Keep the root directory set to the repository root. The included configuration supplies the build command and output directory.
4. Select **Deploy**. This prototype does not require environment variables.

Vercel will redeploy automatically after future pushes to the connected production branch. To test the production bundle locally before pushing, run:

```bash
npm run build:web
```

Quality checks:

```bash
npm run typecheck
npx expo-doctor
npx expo export --platform web --output-dir dist-check
```

## Product architecture

```text
Transaction UI
      │
      ▼
Investigation orchestrator
      │
      ├── get_transaction()             deterministic
      ├── resolve_merchant()            structured resolver
      ├── get_transaction_history()     deterministic
      ├── detect_recurring_pattern()    deterministic
      ├── get_related_transactions()    deterministic
      └── retrieve_payment_policy()     retrieval
      │
      ▼
Structured Investigation result
      │
      ├── outcome + internal evidence quality
      ├── inspectable evidence
      ├── permitted next actions
      └── plain-language explanation
      │
      ▼
Application-owned UI and confirmation gates
```

The current portfolio build runs a deterministic simulator on-device, so a reviewer never needs an API key and the safety behaviour is reproducible. The interface boundary in `src/lib/investigation.ts` is intentionally shaped like a production API response. A matching FastAPI reference service lives in `backend/`; it exposes the health, transaction, investigation, and evaluation contracts without allowing the model to render UI or execute account operations.

## What AI controls — and what it does not

AI/orchestration responsibilities:

- interpret the user’s resolution intent;
- choose read-only investigation tools;
- synthesise retrieved evidence in plain language;
- ask a targeted clarifying question;
- recommend only actions allowed by policy.

Deterministic application responsibilities:

- all money calculations and database reads;
- recurring-pattern rules and transaction linking;
- permissions and allowed action types;
- card state changes and dispute submission;
- confirmation screens, component choice, and visual hierarchy.

The model returns a typed result. It never returns arbitrary UI, chooses button colours, claims fraud, or calls `freeze_card()`.

## Product decision log

### 1. Contextual assistant, not a chatbot

**Initial idea:** Let users ask a finance assistant about any payment.

**Issue:** This forces users to restate context already present in the transaction view.

**Decision:** Put “Check this payment” directly on transaction details and pass the transaction ID into the investigation.

### 2. Evidence before authority

**Initial idea:** Show one generated explanation.

**Issue:** A plausible explanation can hide weak evidence or hallucinated merchant identity.

**Decision:** Show a concise result followed by structured evidence and a payment timeline. Model confidence percentages, latency, and tool names stay entirely out of the customer interface.

### 3. Explicit uncertainty

**Initial idea:** Always return a most-likely merchant.

**Issue:** A forced answer is unsafe when the merchant resolver has no reliable match.

**Decision:** Low-confidence cases state that the merchant could not be identified, then ask the customer a constrained question.

### 4. Human confirmation for consequential actions

**Initial idea:** Automatically freeze a card when the flow looks suspicious.

**Issue:** The system does not have enough context to make that account-level decision, and a false positive disrupts the customer.

**Decision:** Dispute, support, and card security are parallel paths. A customer can dispute while keeping the card active. Before freezing, the product shows subscriptions and linked wallets that may stop working. Only the customer changes card state, and an unfreeze action remains available immediately afterward.

### 5. Resilient demo mode

**Initial idea:** Require a live LLM and hosted database.

**Issue:** Network, quota, and prompt variance make a portfolio walkthrough fragile and hard to evaluate.

**Decision:** Ship reproducible synthetic scenarios and typed orchestration results. Preserve the production service boundary for a later hosted implementation.

## Success metrics

Primary product metric:

- **Self-serve resolution rate:** resolved unfamiliar-payment sessions divided by started investigations.

Guardrail metrics:

- false-dispute rate;
- unnecessary-card-freeze rate;
- unsupported-claim rate;
- escalation correctness;
- median time to resolution;
- p95 investigation latency and cost per investigation.

The demo stores local events for `investigation_started`, `investigation_completed`, `evidence_viewed`, `transaction_recognized`, `dispute_started`, `card_frozen`, `card_unfrozen`, and `support_requested`. These are internal product events and are never shown to the customer.

## UI reference direction

The host-app shell follows public Revolut patterns: a personalised account background, centred balance, circular quick actions, transaction-first activity sheet, search, modal action sheets, and bottom product navigation. The unfamiliar-payment capability is added through the transaction’s existing help area rather than promoted as a new AI destination.

References used for visual and structural calibration:

- [Revolut 10 product update](https://www.revolut.com/blog/post/revolut-10/)
- [Revolut’s official Dribbble work](https://dribbble.com/revolut)
- [Community Revolut UI kit supplied with the brief](https://www.figma.com/design/sMn9wwYvlwExXbJZ81xCyz/Revolut-FREE-UI-Kit---By-Marvilo--Community-?node-id=1-4)

## Evaluation approach

The built-in suite covers five critical behaviours:

- known subscription → explain the recurrence;
- unknown merchant → admit uncertainty;
- reversed authorisation → avoid a false dispute;
- high-risk action → require confirmation;
- missing location → never invent a location.

A production evaluation set would expand this to 50–100 labelled cases and score tool selection, evidence faithfulness, action policy, escalation correctness, latency, and cost independently. Product launch would be gated on both task success and guardrail thresholds.

## Repository map

```text
src/app/                    Expo Router screens
src/components/             Reusable UI primitives
src/data/transactions.ts    Synthetic banking scenarios
src/lib/investigation.ts    Typed orchestration and evaluation cases
src/state/AppState.tsx      Local card state and analytics events
src/theme.ts                Visual tokens
backend/                    FastAPI contract, engine, and unit tests
```

## Deliberate V1 exclusions

- No real bank data or card operations.
- No claim that the system detects fraud.
- No open-ended chat surface.
- No automatic dispute submission.
- No dependency on a paid model or API key.

These are scope and safety decisions, not missing UI. The next production step would be a hosted FastAPI orchestrator, authenticated read-only tool adapters, a versioned policy index, and an offline evaluation pipeline before connecting any write action.

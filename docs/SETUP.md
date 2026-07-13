# Local Development Setup

This guide answers the most common questions about running this backend locally, then gives you exact step-by-step instructions. No prior Azure experience required.

---

## Quick answers before you read anything else

### Do I need a Function App deployed in the Azure Portal to run this locally?

**No.** `func start` runs the entire Azure Functions runtime on your own machine — no Azure portal, no Azure subscription, no deployment needed. The Azure Functions Core Tools (`func`) are a local copy of the same runtime Azure runs in the cloud. Nothing is sent to Azure until you explicitly deploy.

### Can I use a local Cosmos DB Emulator instead of a real Azure account?

**Yes.** Microsoft provides a free local emulator that behaves like Cosmos DB for development. For this take-home, you have two realistic options:

| | **Option A — Cosmos DB Emulator** | **Option B — Real Azure Free-Tier Account** |
|---|---|---|
| **Cost** | Free | Free (1,000 RU/s + 25 GB permanent free tier — sufficient for this project) |
| **Internet required** | No | Yes |
| **Azure account required** | No | Yes (free account, no credit card required after signup with phone verification) |
| **Fidelity** | Good enough for dev/testing | Identical to production |
| **Setup friction** | Install a 100 MB .exe, click through wizard | Create Azure account, navigate portal to create resource |
| **Best for** | Zero friction, fully offline | Want to test against the real service, or plan to demo to reviewers |

**This guide uses Option A (emulator)** because it requires no accounts and works offline. Option B instructions are in the appendix.

### Is deploying a Function App to Azure required for the take-home submission?

**Almost certainly not.** The PRD (§7 Deliverables) says:

> "Run locally" instructions included in each repo's README (or emailed) — env vars, install, start commands

It asks for **locally-runnable code with instructions**, not a deployed URL. The backend submission is a PR against `main` — reviewers will clone the repo and run it. You can skip Azure Portal deployment entirely and come back to it if you want bonus points or a demo URL.

---

## Prerequisites

Install these in order before anything else:

### 1. Node.js ≥ 20

Check if you already have it:
```powershell
node --version
```
If it prints `v20.x.x` or higher, you're good. If not, download from https://nodejs.org (choose the LTS version).

### 2. Azure Functions Core Tools v4

Check if already installed (we did this earlier):
```powershell
func --version
```
If it prints `4.x.x`, skip this step. Otherwise:
```powershell
npm install -g azure-functions-core-tools@4 --unsafe-perm true
```

### 3. Azure Cosmos DB Emulator (Windows only)

Download and install the Windows installer:
**https://aka.ms/cosmosdb-emulator**

Direct link: `https://docs.microsoft.com/en-us/azure/cosmos-db/local-emulator#download`

This is a ~100 MB `.msi` installer. Run it, click Next through the wizard, defaults are fine.

> **Important:** The emulator uses a self-signed TLS certificate at `https://localhost:8081`. Your browser will warn about it — that's expected and safe for local dev.

---

## Step-by-step: get the backend running locally

### Step 1 — Start the Cosmos DB Emulator

After installing, start it from the **Start Menu**: search for "Azure Cosmos DB Emulator" and open it. A tray icon appears in the taskbar when it's running.

Give it 30–60 seconds to fully initialize. You'll know it's ready when this URL works in your browser (accept the certificate warning):
```
https://localhost:8081/_explorer/index.html
```

You should see the **Data Explorer** UI.

### Step 2 — Create the database and container

In the Data Explorer (`https://localhost:8081/_explorer/index.html`):

1. Click **New Database** (top left area)
   - Database id: `TaskApp`
   - Click **OK**

2. Expand `TaskApp` in the left sidebar → click **New Container**
   - Database id: `TaskApp` (already selected)
   - Container id: `Tasks`
   - Partition key: `/organizationId`
   - Throughput: leave as default (400 RU/s)
   - Click **OK**

That's it. The emulator now has the exact database/container this code expects.

### Step 3 — Create `local.settings.json`

This file already exists in the repo root (it was created for you). Open it and confirm it looks like this — the emulator's connection string is the well-known public default:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "COSMOS_CONNECTION_STRING": "AccountEndpoint=https://localhost:8081/;AccountKey=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b5UrC7U4aBBDrBqiMBUNxLYZRHRaA=="
  }
}
```

> **Note:** This connection string/key is the emulator's **public default** — it is the same for every installation and is documented in Microsoft's official docs. It is not a secret. Do not put your real Azure Cosmos connection string here unless you want to use a real account instead.

> **`local.settings.json` is gitignored** — it will never be committed to the repo. This is intentional; real connection strings must never be committed.

### Step 4 — Install dependencies

```powershell
npm install
```

Run this once from the repo root. It installs all Node packages including `@azure/functions`, `@azure/cosmos`, and `ajv`.

### Step 5 — Start the server

```powershell
npm start
```

This runs `tsc` (TypeScript compile) then `func start`. You'll see output like:

```
Azure Functions Core Tools
Core Tools Version: 4.x.x

Functions:
  BulkDeleteTasks: [DELETE] http://localhost:7071/api/BulkDeleteTasks
  DeleteTask:      [DELETE] http://localhost:7071/api/DeleteTask
  GetFormSettings: [GET]    http://localhost:7071/api/GetFormSettings
  GetTask:         [GET]    http://localhost:7071/api/GetTask
  GetTasks:        [GET]    http://localhost:7071/api/GetTasks
  InsertTask:      [POST]   http://localhost:7071/api/InsertTask
  UpdateTask:      [POST]   http://localhost:7071/api/UpdateTask
  UpsertFormSettings: [PUT] http://localhost:7071/api/UpsertFormSettings
```

The server is ready.

### Step 6 — Verify it's working

> **Local auth note:** `authLevel: 'function'` is **not enforced locally** — this is by design in the Azure Functions Core Tools runtime. You can call every endpoint without a `?code=` key during local development. Keys are only enforced when deployed to Azure.

**Test 1 — Insert a task:**
```powershell
$orgId = "00000000-0000-0000-0000-000000000001"

Invoke-RestMethod -Uri "http://localhost:7071/api/InsertTask" `
  -Method POST `
  -ContentType "application/json" `
  -Body ('{
    "id": "00000000-0000-0000-0000-000000000099",
    "organizationId": "' + $orgId + '",
    "title": "My first task",
    "status": "todo"
  }')
```

Expected: a JSON object echoing back the task you just created.

**Test 2 — List tasks:**
```powershell
Invoke-RestMethod "http://localhost:7071/api/GetTasks?organizationId=$orgId"
```

Expected:
```json
{
  "items": [{ "id": "...", "title": "My first task", ... }],
  "continuationToken": null
}
```

If both work, the backend is fully operational.

---

## Appendix — Option B: Real Azure Cosmos DB account (free tier)

Use this if you prefer to test against the real service or want a connection string you can share with reviewers.

### Create a free Azure account
Go to https://azure.microsoft.com/free — click "Start free". You'll need a Microsoft account and a phone number. **No credit card is required** to use the free tier, but Azure does ask for one to verify identity (it is not charged unless you explicitly upgrade).

### Create a Cosmos DB account (free tier)

1. Log into https://portal.azure.com
2. Click **Create a resource** (top left, the `+` button)
3. Search for **Azure Cosmos DB** → click it → click **Create**
4. Choose **Azure Cosmos DB for NoSQL** → click **Create**
5. Fill in:
   - **Subscription**: your free subscription
   - **Resource Group**: click "Create new", name it `kitameraki-rg`
   - **Account Name**: any globally unique name, e.g. `kitameraki-cosmos-yourname`
   - **Location**: pick the nearest region to you
   - **Capacity mode**: **Serverless** (cheapest for dev, no minimum charge)
   - ✅ Check **Apply Free Tier Discount** if it appears
6. Click **Review + Create** → **Create**
7. Wait ~5 minutes for deployment.

### Create the database and container

After the account is created:
1. Go to your Cosmos account → click **Data Explorer** in the left sidebar
2. Click **New Container** (top of the Data Explorer panel)
3. Fill in:
   - Database id: `TaskApp` (select "Create new")
   - Container id: `Tasks`
   - Partition key: `/organizationId`
4. Click **OK**

### Get your connection string

1. In your Cosmos account → left sidebar → **Keys**
2. Copy the **PRIMARY CONNECTION STRING**

### Update `local.settings.json`

Replace the `COSMOS_CONNECTION_STRING` value:
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "COSMOS_CONNECTION_STRING": "AccountEndpoint=https://YOUR-ACCOUNT.documents.azure.com:443/;AccountKey=YOUR-KEY-HERE;"
  }
}
```

Then run `npm start` as normal.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `func: command not found` | Run `npm install -g azure-functions-core-tools@4 --unsafe-perm true`, then restart your terminal |
| `COSMOS_CONNECTION_STRING environment variable is not set` | `local.settings.json` is missing or empty — check Step 3 |
| `503` or connection refused from Cosmos | Emulator isn't running or still starting up — wait 60s and retry |
| Browser shows certificate warning for `https://localhost:8081` | Click "Advanced" → "Proceed" — the emulator's cert is self-signed, this is expected |
| `npm start` fails at `tsc` with type errors | Run `npm install` first, then retry |
| Tasks are inserted but `GetTasks` returns empty | The `organizationId` in your insert and your get request must match exactly |

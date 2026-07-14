# Running the Backend Locally

## 1. Prerequisites

Install these before anything else:

| Tool | Requirement |
|---|---|
| Node.js | v20.x (matches `@types/node` in `package.json`) |
| Azure Functions Core Tools v4 | `npm install -g azure-functions-core-tools@4 --unsafe-perm true` |
| Azure Cosmos DB Emulator | [Download here](https://aka.ms/cosmosdb-emulator) — lets you run this entirely without an Azure account |

## 2. Set up Cosmos DB — choose one path

You need a Cosmos DB instance either way. Pick whichever fits you:

| | Emulator | Real Azure account |
|---|---|---|
| Cost | Free, no Azure account needed | Free (Free Tier gives 1000 RU/s + 25GB forever, one per subscription) or pay-per-request on Serverless |
| Setup time | ~5 min | ~10 min (Azure resource provisioning takes a few minutes) |
| Platform notes | Native install works well on **Windows**. On Mac/Linux it runs via Docker and has known reliability/TLS issues, especially on Apple Silicon | Works identically on any OS, since you're just calling a real HTTPS endpoint |
| Good for | Fast local iteration, no internet dependency | Matches what you'll need anyway if you deploy the Function App later; more reliable if you're not on Windows |

Either path ends with the same result: a `TaskApp` database and `Tasks` container you point the app at. Pick one and follow that section only.

### Option A — Cosmos DB Emulator

1. Download and install from [aka.ms/cosmosdb-emulator](https://aka.ms/cosmosdb-emulator).
2. Launch it from the Start Menu. It takes a minute to start, then opens the Data Explorer at `https://localhost:8081/_explorer/index.html` automatically.
3. In Data Explorer, click **New Container**:
   - Toggle **Create new** database, id: `TaskApp`
   - Container id: `Tasks`
   - Partition key: `/organizationId`
   - Throughput doesn't matter — the emulator doesn't bill, leave it at the default (e.g. 400 RU/s)
4. Click **Create**.
5. Get the connection string: in the emulator's own window (or the Data Explorer's **Quickstart** tab), there's a **Primary Connection String** field with a copy button. It's a fixed, publicly-documented value, identical on every machine's emulator install — the exact value is shown in the "Create `local.settings.json`" section below, you don't need to copy it manually if you're fine using the standard default.

### Option B — Real Azure Cosmos DB account (Free Tier)

1. Go to [portal.azure.com](https://portal.azure.com), search **Azure Cosmos DB** in the top search bar, click **Create**.
2. Choose **Azure Cosmos DB for NoSQL** — this is the Core/SQL API. Do not pick MongoDB, Cassandra, Gremlin, or Table — the backend code uses `@azure/cosmos`, which only speaks the NoSQL/Core API.
3. Fill in the creation form:
   - **Subscription**: your subscription
   - **Resource Group**: create a new one, e.g. `kitameraki-test-rg` — keeps everything for this test easy to find and delete later
   - **Account Name**: must be globally unique, e.g. `kitameraki-yourname-cosmos`
   - **Location**: pick the region closest to you
   - **Capacity mode**: if you see an **Apply Free Tier Discount** toggle, turn it on — gives you 1000 RU/s and 25GB free forever (limited to one free-tier account per subscription). If it's not available (already used on this subscription), choose **Serverless** instead — no minimum cost, billed only per request, cheapest option for a low-traffic test project.
4. Click **Review + Create**, then **Create**. Provisioning takes a few minutes — wait for the "Deployment complete" notification.
5. Once deployed, click **Go to resource**, then in the left sidebar find **Data Explorer** → **New Container**:
   - **Database id**: create new, `TaskApp`
   - **Container id**: `Tasks`
   - **Partition key**: `/organizationId`
   - Click **OK**.
6. Get the connection string: left sidebar → **Settings** → **Keys** → copy the **PRIMARY CONNECTION STRING** field. This is a real secret tied to your account — unlike the emulator's fixed value, treat it like a password.

## 3. Create `local.settings.json`

This file is gitignored — it does not exist until you create it. Create it in the project root.

**If you used the Emulator (Option A):**
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "COSMOS_CONNECTION_STRING": "AccountEndpoint=https://localhost:8081/;AccountKey=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b5UrC7U4aBBDrBqiMBUNxLYZRHRaA==;"
  },
  "Host": {
    "CORS": "http://localhost:5173",
    "CORSCredentials": true
  }
}
```
That `COSMOS_CONNECTION_STRING` value is Microsoft's fixed, publicly-documented emulator default — it's the same on every machine's local emulator and isn't a real secret. It's safe to see in docs/tutorials; it only ever points at `localhost:8081` on your own machine.

**If you used a real Azure account (Option B):**
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "COSMOS_CONNECTION_STRING": "AccountEndpoint=https://kitameraki-yourname-cosmos.documents.azure.com:443/;AccountKey=<your-real-primary-key-from-step-2.6>;"
  },
  "Host": {
    "CORS": "http://localhost:5173",
    "CORSCredentials": true
  }
}
```
Replace both the account URL and the key with your actual values from step 2.6 above. **This connection string is a real credential** — unlike the emulator's fixed value, this one grants full read/write access to your actual Cosmos account. Never commit it, never paste it into a chat/doc/PR that isn't private. `local.settings.json` is already gitignored, so as long as you only ever put it there, you're safe.

Notes that apply either way:

- `AzureWebJobsStorage` — left empty on purpose. This project only has HTTP-triggered functions, and Azure's own docs confirm `AzureWebJobsStorage` is only required for non-HTTP/non-Kafka triggers. You do **not** need to install or run Azurite for this project.
- `CORS` — must exactly match your front-end's dev server URL and port. If your Vite dev server runs on a different port than 5173, change this value to match, or requests from the browser will silently fail with a CORS error, not an obvious backend error.

## 4. Install and run

```bash
npm install
npm start
```

`npm start` runs `prestart` first (cleans `dist/`, rebuilds TypeScript), then starts the Functions host. The API will be available at:

```
http://localhost:7071/api
```

## 5. Verify it's actually working

```bash
curl "http://localhost:7071/api/GetTasks?organizationId=<any-valid-uuid>"
```
Expect a `200` with a JSON body (an empty task list is fine if the container has no data yet). If you get a connection error, the Functions host isn't running or crashed on startup — check the terminal output. If you get a Cosmos-related error, double check the emulator is running and `COSMOS_CONNECTION_STRING` in `local.settings.json` matches it exactly.

## 6. Local auth note

Every endpoint is set to `authLevel: 'function'` in code. This is enforced when deployed to Azure, but the local `func start` runtime does not enforce function keys — you can call every endpoint locally with no `?code=` parameter needed. This only becomes relevant if/when this is deployed to a live Azure Function App.
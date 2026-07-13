# kitameraki-be-test — Backend

Azure Functions v4 (Node/TypeScript) task management API backed by Azure Cosmos DB.

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 20 |
| Azure Functions Core Tools | v4 (`npm install -g azure-functions-core-tools@4 --unsafe-perm true`) |
| TypeScript (local) | 4.9.x (installed via `npm install`) |

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create `local.settings.json`

This file is **gitignored** — never commit it with real secrets.

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "COSMOS_CONNECTION_STRING": "<your-connection-string-here>"
  }
}
```

**Where to get the connection string:**

- **Azure Cosmos DB Emulator (recommended for local dev):** Install the [Azure Cosmos DB Emulator](https://aka.ms/cosmosdb-emulator). The emulator's default connection string is:
  ```
  AccountEndpoint=https://localhost:8081/;AccountKey=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b5UrC7U4aBBDrBqiMBUNxLYZRHRaA==;
  ```
  The emulator creates the `TaskApp` database and `Tasks` container automatically on first use (or create them manually in the Emulator's Data Explorer).

- **Real Azure Cosmos DB account:** Copy the primary connection string from the Azure portal → your Cosmos account → **Keys**.

### 3. Ensure the Cosmos container exists

Database: `TaskApp`  
Container: `Tasks`  
Partition key: `/organizationId`

Create these via the Azure portal, Cosmos DB Emulator Data Explorer, or the Azure CLI:

```bash
az cosmosdb sql database create --account-name <account> --resource-group <rg> --name TaskApp
az cosmosdb sql container create --account-name <account> --resource-group <rg> --database-name TaskApp --name Tasks --partition-key-path /organizationId
```

### 4. Run locally

```bash
npm start
```

This runs `tsc` then `func start`. The API is available at `http://localhost:7071/api`.

### Function key for local dev

With `authLevel: 'function'`, local dev generates a host key automatically. After `func start`, look for output like:

```
Functions:
  GetTasks: [GET] http://localhost:7071/api/GetTasks

For detailed output, run func with --verbose flag.
```

Get the key from `http://localhost:7071/admin/host/keys` (no auth needed locally), then include it as `?code=<key>` or `x-functions-key: <key>` header on every request.

### Build only

```bash
npm run build
```

Output goes to `dist/`.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `COSMOS_CONNECTION_STRING` | ✅ | Full Cosmos DB connection string. Set in `local.settings.json` locally, App Settings / Key Vault reference on Azure. |

## API reference

See [`docs/API_CONTRACT.md`](./docs/API_CONTRACT.md) for the full endpoint reference, request/response shapes, and auth details.

## Deployment

Target: Azure Function App (Consumption or Flex plan).

```bash
func azure functionapp publish <function-app-name>
```

Set `COSMOS_CONNECTION_STRING` in the Function App's Application Settings (or reference a Key Vault secret) — **do not commit real secrets**.

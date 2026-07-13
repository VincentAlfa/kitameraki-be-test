# kitameraki-be-test — Backend

Azure Functions v4 (Node/TypeScript) task management API backed by Azure Cosmos DB.

This repository has been fully refactored to improve **security, readability, and maintainability** per the test requirements.

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 20 |
| Azure Functions Core Tools | v4 (`npm install -g azure-functions-core-tools@4 --unsafe-perm true`) |

## Local setup

The application is configured to run locally without needing an active Azure subscription, by using the free local Cosmos DB Emulator.

### 1. Set up Cosmos DB Emulator

1. Download and install the [Azure Cosmos DB Emulator](https://aka.ms/cosmosdb-emulator).
2. Start the emulator and open the Data Explorer at `https://localhost:8081/_explorer/index.html`.
3. Create the required database and container:
   - **Database id:** `TaskApp`
   - **Container id:** `Tasks`
   - **Partition key:** `/organizationId`

*(Note: If you are using a real Azure Cosmos DB free-tier account instead of the emulator, create the database there and copy your Primary Connection String).*

### 2. Configure environment variables

The `local.settings.json` file is gitignored. Create it in the root of the project:

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
*(The connection string above is the public default for the Cosmos DB Emulator).*

### 3. Run the backend

```bash
npm install
npm start
```

This will run TypeScript compilation and start the Functions host. The API will be available at `http://localhost:7071/api`.

**Authentication note for local dev:** All endpoints use `authLevel: 'function'`, but the local `func start` runtime bypasses key enforcement by design. You can test locally without providing a `?code=` key. Keys are only enforced when deployed to Azure.

## API Reference

See [`docs/API_CONTRACT.md`](./docs/API_CONTRACT.md) for the full endpoint reference, request/response shapes, and details on the `customFields` form builder implementation.

## Deployment to Azure (Optional)

If you wish to deploy this to a live Azure environment:

1. Provision a **Function App** (Node stack) and an **Azure Cosmos DB** account in the Azure Portal.
2. In the Cosmos DB Data Explorer, create the `TaskApp` database and `Tasks` container (Partition key: `/organizationId`).
3. Deploy the code using the Core Tools:
   ```bash
   func azure functionapp publish <your-function-app-name>
   ```
4. In the Function App's Configuration / Environment Variables in the Azure Portal, add the `COSMOS_CONNECTION_STRING` variable containing your real Cosmos DB primary connection string.

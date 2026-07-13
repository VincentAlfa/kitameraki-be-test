import { CosmosClient } from "@azure/cosmos";

// ponytail: single shared client — Cosmos SDK manages internal connection pooling,
// creating one per request is expensive and incorrect.
const connectionString = process.env.COSMOS_CONNECTION_STRING;
if (!connectionString) {
    throw new Error("COSMOS_CONNECTION_STRING environment variable is not set.");
}

const client = new CosmosClient(connectionString);
const db = client.database("TaskApp");

export const tasksContainer = () => db.container("Tasks");

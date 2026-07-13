import { CosmosClient } from "@azure/cosmos";

const connectionString = process.env.COSMOS_CONNECTION_STRING;
if (!connectionString) {
    throw new Error("COSMOS_CONNECTION_STRING environment variable is not set.");
}

const client = new CosmosClient(connectionString);
const db = client.database("TaskApp");

export const tasksContainer = () => db.container("Tasks");

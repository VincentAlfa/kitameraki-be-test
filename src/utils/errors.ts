import { InvocationContext, HttpResponseInit } from "@azure/functions";

export function handleCosmosError(err: any, context: InvocationContext, operationName: string, resourceName: string = "Resource"): HttpResponseInit {
    if (err.code === 404) return { status: 404, jsonBody: { error: `${resourceName} not found.` } };
    if (err.code === 409) return { status: 409, jsonBody: { error: `${resourceName} already exists.` } };
    if (err.code === 429) return { status: 429, jsonBody: { error: "Too many requests. Please retry later." } };
    
    context.log(`${operationName} error: ${err.message}`);
    return { status: 500, jsonBody: { error: `Internal server error: ${err.message}` } };
}

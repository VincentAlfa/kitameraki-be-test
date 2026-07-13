import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { tasksContainer } from "../cosmos";
import { Task } from "../types";

// Fields that must never be patched — they define the document's identity/partition.
const IMMUTABLE_FIELDS = new Set(["id", "organizationId"]);

export async function UpdateTask(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`UpdateTask: ${request.url}`);

    const taskId = request.query.get('id');
    const organizationId = request.query.get('organizationId');

    if (!taskId || !organizationId) {
        return { status: 400, jsonBody: { error: "id and organizationId query params are required." } };
    }

    let body: object;
    try {
        body = await request.json() as object;
    } catch {
        return { status: 400, jsonBody: { error: "Request body must be valid JSON." } };
    }

    const patchOps = Object.entries(body)
        .filter(([key]) => !IMMUTABLE_FIELDS.has(key))
        .map(([key, value]) => ({ op: "replace" as const, path: `/${key}`, value }));

    if (patchOps.length === 0) {
        return { status: 400, jsonBody: { error: "No patchable fields provided." } };
    }

    try {
        const { resource } = await tasksContainer().item(taskId, organizationId).patch<Task>(patchOps);
        return { status: 200, jsonBody: resource };
    } catch (err: any) {
        if (err.code === 404) return { status: 404, jsonBody: { error: "Task not found." } };
        if (err.code === 429) return { status: 429, jsonBody: { error: "Too many requests. Please retry later." } };
        context.log(`UpdateTask error: ${err.message}`);
        return { status: 500, jsonBody: { error: "Internal server error." } };
    }
}

app.http('UpdateTask', {
    methods: ['POST'],
    authLevel: 'function',
    handler: UpdateTask
});

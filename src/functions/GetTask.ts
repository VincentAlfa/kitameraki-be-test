import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { tasksContainer } from "../cosmos";
import { Task } from "../types";

export async function GetTask(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`GetTask: ${request.url}`);

    const taskId = request.query.get('id');
    const organizationId = request.query.get('organizationId');

    if (!taskId || !organizationId) {
        return { status: 400, jsonBody: { error: "id and organizationId query params are required." } };
    }

    try {
        const { resource } = await tasksContainer().item(taskId, organizationId).read<Task>();
        if (!resource) {
            return { status: 404, jsonBody: { error: "Task not found." } };
        }
        return { status: 200, jsonBody: resource };
    } catch (err: any) {
        if (err.code === 404) return { status: 404, jsonBody: { error: "Task not found." } };
        if (err.code === 429) return { status: 429, jsonBody: { error: "Too many requests. Please retry later." } };
        context.log(`GetTask error: ${err.message}`);
        return { status: 500, jsonBody: { error: "Internal server error." } };
    }
}

app.http('GetTask', {
    methods: ['GET'],
    authLevel: 'function',
    handler: GetTask
});

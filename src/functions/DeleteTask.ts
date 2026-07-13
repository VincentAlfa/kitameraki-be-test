import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { tasksContainer } from "../cosmos";

export async function DeleteTask(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`DeleteTask: ${request.url}`);

    const taskId = request.query.get('id');
    const organizationId = request.query.get('organizationId');

    if (!taskId || !organizationId) {
        return { status: 400, jsonBody: { error: "id and organizationId query params are required." } };
    }

    try {
        await tasksContainer().item(taskId, organizationId).delete();
        return { status: 200 };
    } catch (err: any) {
        if (err.code === 404) return { status: 404, jsonBody: { error: "Task not found." } };
        if (err.code === 429) return { status: 429, jsonBody: { error: "Too many requests. Please retry later." } };
        context.log(`DeleteTask error: ${err.message}`);
        return { status: 500, jsonBody: { error: "Internal server error." } };
    }
}

app.http('DeleteTask', {
    methods: ['DELETE'],
    authLevel: 'function',
    handler: DeleteTask
});

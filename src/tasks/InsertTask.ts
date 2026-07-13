import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { tasksContainer } from "../cosmos";
import { Task } from "../types";
import { taskErrors } from "../validate";

export async function InsertTask(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`InsertTask: ${request.url}`);

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return { status: 400, jsonBody: { error: "Request body must be valid JSON." } };
    }

    const errors = taskErrors(body);
    if (errors.length > 0) {
        return { status: 400, jsonBody: { error: "Validation failed.", details: errors } };
    }

    try {
        const { resource } = await tasksContainer().items.create<Task>(body as Task);
        return { status: 200, jsonBody: resource };
    } catch (err: any) {
        if (err.code === 409) return { status: 409, jsonBody: { error: "A task with this id already exists." } };
        if (err.code === 429) return { status: 429, jsonBody: { error: "Too many requests. Please retry later." } };
        context.log(`InsertTask error: ${err.message}`);
        return { status: 500, jsonBody: { error: "Internal server error." } };
    }
}

app.http('InsertTask', {
    methods: ['POST'],
    authLevel: 'function',
    handler: InsertTask
});

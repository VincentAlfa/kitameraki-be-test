import { app, HttpRequest, InvocationContext } from "@azure/functions";
import { taskService } from "../services/taskService";
import { ok, badRequest, notFound } from "../utils/responses";
import { handleCosmosError } from "../utils/errors";

export async function GetTask(request: HttpRequest, context: InvocationContext) {
    context.log(`GetTask: ${request.url}`);

    const taskId = request.query.get('id');
    const organizationId = request.query.get('organizationId');

    if (!taskId || !organizationId) {
        return badRequest("id and organizationId query params are required.");
    }

    try {
        const resource = await taskService.getTask(taskId, organizationId);
        if (!resource) return notFound("Task not found.");
        return ok(resource);
    } catch (err: any) {
        return handleCosmosError(err, context, "GetTask", "Task");
    }
}

app.http('GetTask', { methods: ['GET'], authLevel: 'function', handler: GetTask });

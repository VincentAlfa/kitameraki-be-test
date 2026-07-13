import { app, HttpRequest, InvocationContext } from "@azure/functions";
import { taskService } from "../services/taskService";
import { ok, badRequest } from "../utils/responses";
import { handleCosmosError } from "../utils/errors";

export async function DeleteTask(request: HttpRequest, context: InvocationContext) {
    context.log(`DeleteTask: ${request.url}`);

    const taskId = request.query.get('id');
    const organizationId = request.query.get('organizationId');
    if (!taskId || !organizationId) return badRequest("id and organizationId query params are required.");

    try {
        await taskService.deleteTask(taskId, organizationId);
        return ok({ message: "Task deleted successfully" });
    } catch (err: any) {
        return handleCosmosError(err, context, "DeleteTask", "Task");
    }
}

app.http('DeleteTask', { methods: ['DELETE'], authLevel: 'function', handler: DeleteTask });

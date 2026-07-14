import { app, HttpRequest, InvocationContext } from "@azure/functions";
import { taskService } from "../services/taskService";
import { ok, badRequest } from "../utils/responses";
import { handleCosmosError } from "../utils/errors";

const VALID_STATUS = new Set(["todo", "in-progress", "completed"]);
const VALID_PRIORITY = new Set(["low", "medium", "high"]);

export async function GetTasks(request: HttpRequest, context: InvocationContext) {
    context.log(`GetTasks: ${request.url}`);

    const organizationId = request.query.get('organizationId');
    if (!organizationId) return badRequest("organizationId query param is required.");

    const status = request.query.get('status') ?? undefined;
    const priority = request.query.get('priority') ?? undefined;
    const search = request.query.get('search') ?? undefined;
    const continuationToken = request.query.get('continuationToken') ?? undefined;

    const limitParam = request.query.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    if (status && !VALID_STATUS.has(status)) return badRequest(`Invalid status. Allowed: ${[...VALID_STATUS].join(', ')}.`);
    if (priority && !VALID_PRIORITY.has(priority)) return badRequest(`Invalid priority. Allowed: ${[...VALID_PRIORITY].join(', ')}.`);
    if (isNaN(limit) || limit < 1 || limit > 100) return badRequest("Invalid limit. Must be between 1 and 100.");

    try {
        const result = await taskService.getTasks(organizationId, status, priority, search, continuationToken, limit);
        return ok(result);
    } catch (err: any) {
        return handleCosmosError(err, context, "GetTasks", "Task");
    }
}

app.http('GetTasks', { methods: ['GET'], authLevel: 'function', handler: GetTasks });

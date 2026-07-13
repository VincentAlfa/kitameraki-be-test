import { app, HttpRequest, InvocationContext } from "@azure/functions";
import { taskService } from "../services/taskService";
import { ok, badRequest } from "../utils/responses";
import { parseJsonBody } from "../utils/requests";

export async function BulkDeleteTasks(request: HttpRequest, context: InvocationContext) {
    context.log(`BulkDeleteTasks: ${request.url}`);

    const organizationId = request.query.get('organizationId');
    if (!organizationId) return badRequest("organizationId query param is required.");

    const { data: ids, errorResponse } = await parseJsonBody<string[]>(request);
    if (errorResponse) return errorResponse;

    if (!Array.isArray(ids) || ids.some(id => typeof id !== 'string')) {
        return badRequest("Body must be a JSON array of task id strings.");
    }

    const result = await taskService.bulkDeleteTasks(ids, organizationId, msg => context.log(msg));
    return ok(result);
}

app.http('BulkDeleteTasks', { methods: ['DELETE'], authLevel: 'function', handler: BulkDeleteTasks });

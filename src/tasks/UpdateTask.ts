import { app, HttpRequest, InvocationContext } from "@azure/functions";
import { taskService } from "../services/taskService";
import { ok, badRequest } from "../utils/responses";
import { parseJsonBody } from "../utils/requests";
import { handleCosmosError } from "../utils/errors";
import { taskPatchErrors } from "../validation/task";

const IMMUTABLE_FIELDS = new Set(["id", "organizationId"]);

export async function UpdateTask(request: HttpRequest, context: InvocationContext) {
    context.log(`UpdateTask: ${request.url}`);

    const taskId = request.query.get('id');
    const organizationId = request.query.get('organizationId');
    if (!taskId || !organizationId) return badRequest("id and organizationId query params are required.");

    const { data: body, errorResponse } = await parseJsonBody<object>(request);
    if (errorResponse) return errorResponse;

    const errors = taskPatchErrors(body);
    if (errors.length > 0) return badRequest("Validation failed.", errors);

    const patchOps = Object.entries(body)
        .filter(([key]) => !IMMUTABLE_FIELDS.has(key))
        .map(([key, value]) => ({ op: "replace" as const, path: `/${key}`, value }));

    if (patchOps.length === 0) return badRequest("No patchable fields provided.");

    try {
        const resource = await taskService.updateTask(taskId, organizationId, patchOps);
        return ok(resource);
    } catch (err: any) {
        return handleCosmosError(err, context, "UpdateTask", "Task");
    }
}

app.http('UpdateTask', { methods: ['POST'], authLevel: 'function', handler: UpdateTask });

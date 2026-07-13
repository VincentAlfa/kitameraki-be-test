import { app, HttpRequest, InvocationContext } from "@azure/functions";
import { taskService } from "../services/taskService";
import { ok, badRequest } from "../utils/responses";
import { parseJsonBody } from "../utils/requests";
import { handleCosmosError } from "../utils/errors";
import { Task } from "../types";
import { taskErrors } from "../validation/task";

export async function InsertTask(request: HttpRequest, context: InvocationContext) {
    context.log(`InsertTask: ${request.url}`);

    const { data: body, errorResponse } = await parseJsonBody(request);
    if (errorResponse) return errorResponse;

    const errors = taskErrors(body);
    if (errors.length > 0) return badRequest("Validation failed.", errors);

    try {
        const resource = await taskService.insertTask(body as Task);
        return ok(resource);
    } catch (err: any) {
        return handleCosmosError(err, context, "InsertTask", "Task");
    }
}

app.http('InsertTask', { methods: ['POST'], authLevel: 'function', handler: InsertTask });

import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { tasksContainer } from "../cosmos";
import { BulkDeleteResult } from "../types";

export async function BulkDeleteTasks(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`BulkDeleteTasks: ${request.url}`);

    const organizationId = request.query.get('organizationId');
    if (!organizationId) {
        return { status: 400, jsonBody: { error: "organizationId query param is required." } };
    }

    let ids: string[];
    try {
        ids = await request.json() as string[];
        if (!Array.isArray(ids) || ids.some(id => typeof id !== 'string')) {
            return { status: 400, jsonBody: { error: "Body must be a JSON array of task id strings." } };
        }
    } catch {
        return { status: 400, jsonBody: { error: "Request body must be valid JSON." } };
    }

    const results = await Promise.allSettled(
        ids.map(id => tasksContainer().item(id, organizationId).delete())
    );

    const result: BulkDeleteResult = { succeeded: [], failed: [] };
    results.forEach((outcome, i) => {
        if (outcome.status === 'fulfilled') {
            result.succeeded.push(ids[i]);
        } else {
            context.log(`BulkDeleteTasks: failed to delete ${ids[i]}: ${outcome.reason}`);
            result.failed.push(ids[i]);
        }
    });

    return { status: 200, jsonBody: result };
}

app.http('BulkDeleteTasks', {
    methods: ['DELETE'],
    authLevel: 'function',
    handler: BulkDeleteTasks
});

import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { tasksContainer } from "../cosmos";
import { Task } from "../types";

const VALID_STATUS = new Set(["todo", "in-progress", "completed"]);
const VALID_PRIORITY = new Set(["low", "medium", "high"]);
const PAGE_SIZE = 20;

export async function GetTasks(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`GetTasks: ${request.url}`);

    const organizationId = request.query.get('organizationId');
    if (!organizationId) {
        return { status: 400, jsonBody: { error: "organizationId query param is required." } };
    }

    const status = request.query.get('status') ?? undefined;
    const priority = request.query.get('priority') ?? undefined;
    const search = request.query.get('search') ?? undefined;
    const continuationToken = request.query.get('continuationToken') ?? undefined;

    if (status && !VALID_STATUS.has(status)) {
        return { status: 400, jsonBody: { error: `Invalid status. Allowed: ${[...VALID_STATUS].join(', ')}.` } };
    }
    if (priority && !VALID_PRIORITY.has(priority)) {
        return { status: 400, jsonBody: { error: `Invalid priority. Allowed: ${[...VALID_PRIORITY].join(', ')}.` } };
    }

    const conditions: string[] = ["c.organizationId = @organizationId"];
    const parameters: { name: string; value: string }[] = [
        { name: "@organizationId", value: organizationId }
    ];

    conditions.push("(NOT IS_DEFINED(c.type) OR c.type != 'formSettings')");

    if (status) {
        conditions.push("c.status = @status");
        parameters.push({ name: "@status", value: status });
    }
    if (priority) {
        conditions.push("c.priority = @priority");
        parameters.push({ name: "@priority", value: priority });
    }
    if (search) {
        conditions.push("(CONTAINS(c.title, @search, true) OR CONTAINS(c.description, @search, true))");
        parameters.push({ name: "@search", value: search });
    }

    const querySpec = {
        query: `SELECT * FROM c WHERE ${conditions.join(" AND ")}`,
        parameters,
    };

    try {
        const iterator = tasksContainer().items.query<Task>(querySpec, {
            maxItemCount: PAGE_SIZE,
            continuationToken,
        });

        const page = await iterator.fetchNext();

        return {
            status: 200,
            jsonBody: {
                items: page.resources,
                continuationToken: page.continuationToken ?? null,
            },
        };
    } catch (err: any) {
        if (err.code === 429) return { status: 429, jsonBody: { error: "Too many requests. Please retry later." } };
        context.log(`GetTasks error: ${err.message}`);
        return { status: 500, jsonBody: { error: "Internal server error." } };
    }
}

app.http('GetTasks', {
    methods: ['GET'],
    authLevel: 'function',
    handler: GetTasks
});

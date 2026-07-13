import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { tasksContainer } from "../cosmos";
import { FormSettings, FormField } from "../types";

const SETTINGS_ID = "formSettings";

function isValidField(f: unknown): f is FormField {
    if (typeof f !== 'object' || f === null) return false;
    const field = f as Record<string, unknown>;
    return (
        typeof field.id === 'string' &&
        typeof field.label === 'string' &&
        ['text', 'date', 'datetime', 'email'].includes(field.type as string) &&
        typeof field.column === 'number' &&
        typeof field.order === 'number' &&
        typeof field.required === 'boolean'
    );
}

export async function UpsertFormSettings(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`UpsertFormSettings: ${request.url}`);

    const organizationId = request.query.get('organizationId');
    if (!organizationId) {
        return { status: 400, jsonBody: { error: "organizationId query param is required." } };
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return { status: 400, jsonBody: { error: "Request body must be valid JSON." } };
    }

    const payload = body as Record<string, unknown>;
    if (!Array.isArray(payload.fields) || !payload.fields.every(isValidField)) {
        return { status: 400, jsonBody: { error: "Body must have a 'fields' array of valid FormField objects." } };
    }

    const doc: FormSettings = {
        id: SETTINGS_ID,
        organizationId,
        type: "formSettings",
        fields: payload.fields as FormField[],
    };

    try {
        const { resource } = await tasksContainer().items.upsert<FormSettings>(doc);
        return { status: 200, jsonBody: resource };
    } catch (err: any) {
        if (err.code === 429) return { status: 429, jsonBody: { error: "Too many requests. Please retry later." } };
        context.log(`UpsertFormSettings error: ${err.message}`);
        return { status: 500, jsonBody: { error: "Internal server error." } };
    }
}

app.http('UpsertFormSettings', {
    methods: ['PUT'],
    authLevel: 'function',
    handler: UpsertFormSettings
});

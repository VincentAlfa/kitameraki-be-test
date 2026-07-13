import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { tasksContainer } from "../cosmos";
import { FormSettings } from "../types";

// ponytail: form settings are stored in the Tasks container with type="formSettings"
// so no second Cosmos container is needed. The partition key is still organizationId.
const SETTINGS_ID = "formSettings"; // synthetic document id — one per org

export async function GetFormSettings(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`GetFormSettings: ${request.url}`);

    const organizationId = request.query.get('organizationId');
    if (!organizationId) {
        return { status: 400, jsonBody: { error: "organizationId query param is required." } };
    }

    try {
        const { resource } = await tasksContainer()
            .item(SETTINGS_ID, organizationId)
            .read<FormSettings>();

        // "no settings yet" is a normal state, not an error — return empty fields array.
        if (!resource) {
            return { status: 200, jsonBody: { organizationId, fields: [] } };
        }

        return { status: 200, jsonBody: resource };
    } catch (err: any) {
        if (err.code === 404) {
            return { status: 200, jsonBody: { organizationId, fields: [] } };
        }
        if (err.code === 429) return { status: 429, jsonBody: { error: "Too many requests. Please retry later." } };
        context.log(`GetFormSettings error: ${err.message}`);
        return { status: 500, jsonBody: { error: "Internal server error." } };
    }
}

app.http('GetFormSettings', {
    methods: ['GET'],
    authLevel: 'function',
    handler: GetFormSettings
});

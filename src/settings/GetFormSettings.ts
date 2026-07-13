import { app, HttpRequest, InvocationContext } from "@azure/functions";
import { formSettingsService } from "../services/formSettingsService";
import { ok, badRequest } from "../utils/responses";
import { handleCosmosError } from "../utils/errors";

export async function GetFormSettings(request: HttpRequest, context: InvocationContext) {
    context.log(`GetFormSettings: ${request.url}`);

    const organizationId = request.query.get('organizationId');
    if (!organizationId) return badRequest("organizationId query param is required.");

    try {
        const resource = await formSettingsService.getFormSettings(organizationId);
        if (!resource) return ok({ organizationId, fields: [] });
        return ok(resource);
    } catch (err: any) {
        return handleCosmosError(err, context, "GetFormSettings", "Form Settings");
    }
}

app.http('GetFormSettings', { methods: ['GET'], authLevel: 'function', handler: GetFormSettings });

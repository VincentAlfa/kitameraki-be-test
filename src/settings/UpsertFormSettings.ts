import { app, HttpRequest, InvocationContext } from "@azure/functions";
import { formSettingsService } from "../services/formSettingsService";
import { ok, badRequest } from "../utils/responses";
import { parseJsonBody } from "../utils/requests";
import { handleCosmosError } from "../utils/errors";
import { FormSettings, FormField } from "../types";
import { formSettingsPayloadErrors } from "../validation/formSettings";

const SETTINGS_ID = "formSettings";

export async function UpsertFormSettings(request: HttpRequest, context: InvocationContext) {
    context.log(`UpsertFormSettings: ${request.url}`);

    const organizationId = request.query.get('organizationId');
    if (!organizationId) return badRequest("organizationId query param is required.");

    const { data: body, errorResponse } = await parseJsonBody(request);
    if (errorResponse) return errorResponse;

    const errors = formSettingsPayloadErrors(body);
    if (errors.length > 0) return badRequest("Validation failed.", errors);
    
    const payload = body as { fields: FormField[] };

    const doc: FormSettings = {
        id: SETTINGS_ID,
        organizationId,
        type: "formSettings",
        fields: payload.fields,
    };

    try {
        const resource = await formSettingsService.upsertFormSettings(doc);
        return ok(resource);
    } catch (err: any) {
        return handleCosmosError(err, context, "UpsertFormSettings", "Form Settings");
    }
}

app.http('UpsertFormSettings', { methods: ['PUT'], authLevel: 'function', handler: UpsertFormSettings });

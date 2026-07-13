import Ajv from "ajv";
import addFormats from "ajv-formats";
import taskSchema from "../../task.schema.json";

// ponytail: compile once at module load, not per-request.
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Allow customFields on top of the base schema (Option A).
const schemaWithCustomFields = {
    ...taskSchema,
    properties: {
        ...taskSchema.properties,
        customFields: {
            type: "object",
            additionalProperties: { type: "string" },
        },
    },
    // additionalProperties: false is preserved from the base schema for fixed fields.
};

export const validateTask = ajv.compile(schemaWithCustomFields);

/** Returns a list of error messages, or an empty array if valid. */
export function taskErrors(data: unknown): string[] {
    const valid = validateTask(data);
    if (valid) return [];
    return (validateTask.errors ?? []).map(e => `${e.instancePath} ${e.message}`);
}

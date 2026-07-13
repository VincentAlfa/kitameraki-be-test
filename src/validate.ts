import Ajv from "ajv";
import addFormats from "ajv-formats";
import taskSchema from "../task.schema.json";

// ponytail: compile once at module load, not per-request.
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

export const validateTask = ajv.compile(taskSchema);

/** Returns a list of error messages, or an empty array if valid. */
export function taskErrors(data: unknown): string[] {
    const valid = validateTask(data);
    if (valid) return [];
    return (validateTask.errors ?? []).map(e => `${e.instancePath} ${e.message}`);
}

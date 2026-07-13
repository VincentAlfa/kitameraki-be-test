import { z } from "zod";

export const formFieldSchema = z.object({
    id: z.string(),
    label: z.string(),
    type: z.enum(["text", "date", "datetime", "email"]),
    column: z.number(),
    order: z.number(),
    required: z.boolean()
}).strict();

export const formSettingsPayloadSchema = z.object({
    fields: z.array(formFieldSchema)
}).strict();

export const formSettingsSchema = z.object({
    id: z.literal("formSettings"),
    organizationId: z.string().uuid(),
    fields: z.array(formFieldSchema),
    type: z.literal("formSettings")
}).strict();

export function formSettingsPayloadErrors(data: unknown): string[] {
    try {
        formSettingsPayloadSchema.parse(data);
        return [];
    } catch (e) {
        if (e instanceof z.ZodError) {
            return e.issues.map(issue => {
                const p = issue.path.join("/");
                return `${p ? `/${p}` : ""} ${issue.message}`;
            });
        }
        return ["Unknown validation error."];
    }
}

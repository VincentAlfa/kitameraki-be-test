import { z } from "zod";

export const taskSchema = z.object({
    id: z.string().uuid("Invalid UUID for id"),
    organizationId: z.string().uuid("Invalid UUID for organizationId"),
    title: z.string().max(100, "Title must be at most 100 characters"),
    description: z.string().max(1000, "Description must be at most 1000 characters").optional(),
    dueDate: z.string().optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    status: z.enum(["todo", "in-progress", "completed"]),
    tags: z.array(z.string().max(50)).optional(),
    customFields: z.record(z.string(), z.string()).optional()
}).strict();

export function taskErrors(data: unknown): string[] {
    try {
        taskSchema.parse(data);
        return [];
    } catch (e) {
        if (e instanceof z.ZodError) {
            return e.issues.map(issue => {
                const path = issue.path.join("/");
                return `${path ? `/${path}` : ""} ${issue.message}`;
            });
        }
        return ["Unknown validation error."];
    }
}

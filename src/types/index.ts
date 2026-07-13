import { z } from "zod";
import { taskSchema } from "../validation/task";

export type Task = z.infer<typeof taskSchema>;

import { formSettingsSchema, formFieldSchema } from "../validation/formSettings";

export type FormField = z.infer<typeof formFieldSchema>;
export type FormSettings = z.infer<typeof formSettingsSchema>;

export interface BulkDeleteResult {
    succeeded: string[];
    failed: string[];
}

import { z } from "zod";
import { taskSchema } from "./validate";

export type Task = z.infer<typeof taskSchema>;

export interface FormField {
    id: string;
    label: string;
    type: "text" | "date" | "datetime" | "email";
    column: number;
    order: number;
    required: boolean;
}

export interface FormSettings {
    id: string;
    organizationId: string;
    fields: FormField[];
    type: "formSettings";
}

export interface BulkDeleteResult {
    succeeded: string[];
    failed: string[];
}

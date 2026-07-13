// Single source of truth for domain types — mirrors task.schema.json.
// Option A applied: customFields is a nested object, keeping additionalProperties: false
// on the top-level schema intact for the fixed fields.

export interface Task {
    id: string;
    organizationId: string;
    title: string;
    description?: string;
    dueDate?: string;
    priority?: "low" | "medium" | "high";
    status: "todo" | "in-progress" | "completed";
    tags?: string[];
    customFields?: Record<string, string>;
}

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
    /** Discriminator so formSettings docs can coexist in the Tasks container. */
    type: "formSettings";
}

export interface BulkDeleteResult {
    succeeded: string[];
    failed: string[];
}

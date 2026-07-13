import { tasksContainer } from "../config/cosmos";
import { Task, BulkDeleteResult } from "../types";

const PAGE_SIZE = 20;

export const taskService = {
    async getTask(id: string, organizationId: string): Promise<Task | undefined> {
        const { resource } = await tasksContainer().item(id, organizationId).read<Task>();
        return resource;
    },

    async getTasks(organizationId: string, status?: string, priority?: string, search?: string, continuationToken?: string) {
        const conditions: string[] = ["c.organizationId = @organizationId"];
        const parameters: { name: string; value: string }[] = [{ name: "@organizationId", value: organizationId }];

        conditions.push("(NOT IS_DEFINED(c.type) OR c.type != 'formSettings')");

        if (status) {
            conditions.push("c.status = @status");
            parameters.push({ name: "@status", value: status });
        }
        if (priority) {
            conditions.push("c.priority = @priority");
            parameters.push({ name: "@priority", value: priority });
        }
        if (search) {
            conditions.push("(CONTAINS(c.title, @search, true) OR CONTAINS(c.description, @search, true))");
            parameters.push({ name: "@search", value: search });
        }

        const querySpec = {
            query: `SELECT * FROM c WHERE ${conditions.join(" AND ")}`,
            parameters,
        };

        const iterator = tasksContainer().items.query<Task>(querySpec, {
            maxItemCount: PAGE_SIZE,
            continuationToken,
        });

        const page = await iterator.fetchNext();
        return {
            items: page.resources,
            continuationToken: page.continuationToken ?? null,
        };
    },

    async insertTask(task: Task): Promise<Task | undefined> {
        const { resource } = await tasksContainer().items.create<Task>(task);
        return resource;
    },

    async updateTask(id: string, organizationId: string, patchOps: { op: "replace", path: string, value: any }[]): Promise<Task | undefined> {
        const { resource } = await tasksContainer().item(id, organizationId).patch<Task>(patchOps);
        return resource;
    },

    async deleteTask(id: string, organizationId: string): Promise<void> {
        await tasksContainer().item(id, organizationId).delete();
    },

    async bulkDeleteTasks(ids: string[], organizationId: string, logFn: (msg: string) => void): Promise<BulkDeleteResult> {
        const results = await Promise.allSettled(
            ids.map(id => tasksContainer().item(id, organizationId).delete())
        );

        const result: BulkDeleteResult = { succeeded: [], failed: [] };
        results.forEach((outcome, i) => {
            if (outcome.status === 'fulfilled') {
                result.succeeded.push(ids[i]);
            } else {
                logFn(`BulkDeleteTasks: failed to delete ${ids[i]}: ${outcome.reason}`);
                result.failed.push(ids[i]);
            }
        });
        return result;
    }
};

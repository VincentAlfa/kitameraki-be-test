import { tasksContainer } from "../config/cosmos";
import { FormSettings } from "../types";

const SETTINGS_ID = "formSettings";

export const formSettingsService = {
    async getFormSettings(organizationId: string): Promise<FormSettings | undefined> {
        const { resource } = await tasksContainer().item(SETTINGS_ID, organizationId).read<FormSettings>();
        return resource;
    },

    async upsertFormSettings(doc: FormSettings): Promise<FormSettings | undefined> {
        const { resource } = await tasksContainer().items.upsert<FormSettings>(doc);
        return resource;
    }
};

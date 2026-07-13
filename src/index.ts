import { app } from '@azure/functions';

import "./settings/GetFormSettings";
import "./settings/UpsertFormSettings";

import "./tasks/BulkDeleteTasks";
import "./tasks/DeleteTask";
import "./tasks/GetTask";
import "./tasks/GetTasks";
import "./tasks/InsertTask";
import "./tasks/UpdateTask";

app.setup({
    enableHttpStream: true,
});

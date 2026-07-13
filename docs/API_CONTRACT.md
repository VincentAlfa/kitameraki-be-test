# API_CONTRACT.md — Front-end ⟷ Backend Contract

Single source of truth for every endpoint. Both repos' `AGENTS.md` should point here. **When the backend changes a route, request, or response shape, update this file in the same PR/commit — the front-end agent should never have to read backend source to know what to call.**

Status tags: `AS-IS` = matches current backend code exactly. `TODO` = required by PRD.md but not implemented yet — whoever builds it updates this doc to `AS-IS` once done.

## Base URL

Local dev: `http://localhost:7071/api` (default Azure Functions Core Tools port)
Deployed: TBD — fill in once the Function App is deployed, front-end `.env` should point here via `VITE_API_BASE_URL`.

## Auth

All endpoints use `authLevel: 'function'`. Requests must include the function key either as a query param (`?code=<key>`) or the `x-functions-key` header. See README for how to get the key during local dev.

## Task endpoints

### `GET /GetTasks?organizationId={uuid}` — AS-IS

Query params:

| Param | Required | Description |
|---|---|---|
| `organizationId` | ✅ | Org to scope results to |
| `status` | ❌ | Filter: `todo` \| `in-progress` \| `completed` |
| `priority` | ❌ | Filter: `low` \| `medium` \| `high` |
| `search` | ❌ | Case-insensitive substring match on `title` and `description` |
| `continuationToken` | ❌ | Opaque token from previous response to get next page |

Response `200`:
```json
{
  "items": [ /* Task[] */ ],
  "continuationToken": "<string or null>"
}
```
Page size is 20 items. When `continuationToken` in the response is `null`, there are no more pages.

Returns `400` for invalid `status`/`priority` enum values.

### `GET /GetTask?id={uuid}&organizationId={uuid}` — AS-IS

Response: `200`, single `Task` object.
Returns `404` if the task does not exist (previously returned undefined/empty — now fixed).

### `POST /InsertTask` — AS-IS

Body: full `Task` object (client generates `id`, typically `crypto.randomUUID()`).
Response: `200`, the created `Task`.

Validation: body is validated against `task.schema.json`. On failure: `400` with body:
```json
{ "error": "Validation failed.", "details": ["<path> <message>", ...] }
```

### `POST /UpdateTask?id={uuid}&organizationId={uuid}` — AS-IS

Body: **partial** object — any subset of `Task` fields you want to change, e.g. `{ "status": "completed" }`. Backend converts each key into a JSON-Patch replace op.
Response: `200`, the updated `Task`.

Note: `id` and `organizationId` in the body are silently ignored (immutable). This is `POST`, not `PATCH` or `PUT`.

### `DELETE /DeleteTask?id={uuid}&organizationId={uuid}` — AS-IS

Response: `200`, empty body.
Returns `404` if the task does not exist.

### `DELETE /BulkDeleteTasks?organizationId={uuid}` — AS-IS (bug fixed)

Body: JSON array of task id strings, e.g. `["id1", "id2"]`.

Response `200`:
```json
{ "succeeded": ["id1"], "failed": ["id2"] }
```
Previously returned empty body before deletes finished (see `BACKEND_AUDIT.md` #6 — now fixed). The response now reports per-id success/failure so the front-end can handle partial failures gracefully.

## Task schema (source of truth: `task.schema.json` in the backend repo)

```json
{
  "id": "string (uuid, required)",
  "organizationId": "string (uuid, required)",
  "title": "string, max 100 (required)",
  "description": "string, max 1000 (optional)",
  "dueDate": "string, date-time (optional)",
  "priority": "low | medium | high (optional)",
  "status": "todo | in-progress | completed (required)",
  "tags": "string[], each max 50 (optional)",
  "customFields": "{ [fieldId: string]: string } (optional)"
}
```

`additionalProperties: false` on fixed fields — **Option A chosen**: custom field values go in a nested `customFields` object (e.g. `{ "customFields": { "field-abc": "some value" } }`). This keeps the fixed-field schema strict while accommodating PRD §6 form builder values. See `task.schema.json` for the full JSON Schema.

## Form settings endpoints — AS-IS

Needed for PRD §6. Form settings are stored in the same `Tasks` Cosmos container with `type: "formSettings"` as a discriminator (same partition key `organizationId`), avoiding a second container.

### `GET /GetFormSettings?organizationId={uuid}` — AS-IS

Response `200`:
```json
{
  "id": "formSettings",
  "organizationId": "uuid",
  "type": "formSettings",
  "fields": [
    { "id": "string", "label": "string", "type": "text | date | datetime | email", "column": 1, "order": 0, "required": false }
  ]
}
```
If no settings exist for the org yet, returns `{ "organizationId": "<uuid>", "fields": [] }` (not a `404`). Front-end should treat an empty `fields` array as "no custom fields configured."

### `PUT /UpsertFormSettings?organizationId={uuid}` — AS-IS

Body:
```json
{
  "fields": [
    { "id": "string", "label": "string", "type": "text | date | datetime | email", "column": 1, "order": 0, "required": false }
  ]
}
```
Replace-all semantics — the entire `fields` array is replaced. Response `200`, the saved `FormSettings` object.

Returns `400` if `fields` is missing or contains invalid field objects.

## How to keep this in sync

- Backend `AGENTS.md` should instruct: "any route, param, or response shape change must be reflected in `API_CONTRACT.md` in the same commit."
- Front-end `AGENTS.md` should instruct: "treat this file as the only source of truth for API shape — don't infer request/response shapes from guesswork or from reading backend source directly."
- If the two repos genuinely drift (e.g. backend ships a change without updating this doc), the fix is to update this doc from the real backend code, not to patch around the mismatch in front-end code.

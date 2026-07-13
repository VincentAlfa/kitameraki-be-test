import { HttpResponseInit } from "@azure/functions";

const jsonResponse = (status: number, body: unknown): HttpResponseInit => ({
    status,
    jsonBody: body
});

export const ok = (body: unknown): HttpResponseInit => jsonResponse(200, body);
export const created = (body: unknown): HttpResponseInit => jsonResponse(201, body);

export const badRequest = (message: string, details?: unknown): HttpResponseInit => 
    jsonResponse(400, { error: message, ...(details ? { details } : {}) });

export const notFound = (message: string): HttpResponseInit => 
    jsonResponse(404, { error: message });

export const tooManyRequests = (message: string = "Too many requests. Please retry later."): HttpResponseInit => 
    jsonResponse(429, { error: message });

export const internalServerError = (message: string = "Internal server error."): HttpResponseInit => 
    jsonResponse(500, { error: message });

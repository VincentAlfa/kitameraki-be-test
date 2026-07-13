import { HttpRequest, HttpResponseInit } from "@azure/functions";
import { badRequest } from "./responses";

export async function parseJsonBody<T = unknown>(request: HttpRequest): Promise<{ data?: T, errorResponse?: HttpResponseInit }> {
    try {
        const data = await request.json();
        return { data: data as T };
    } catch {
        return { errorResponse: badRequest("Request body must be valid JSON.") };
    }
}

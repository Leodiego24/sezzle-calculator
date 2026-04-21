/**
 * Types mirroring the backend API contract for the calculator service.
 */

export type Operation = 'add' | 'subtract' | 'multiply' | 'divide';

export interface CalculateRequest {
  operation: Operation;
  operands: [number, number];
}

export interface CalculateResponse {
  operation: Operation;
  operands: [number, number];
  result: number;
}

export interface ApiErrorPayload {
  error: string;
  message: string;
  details?: Record<string, unknown> | null;
}

/**
 * Error thrown by the API client when the server returns a non-2xx response
 * with a parseable error body.
 */
export class ApiError extends Error {
  public status: number;
  public payload: ApiErrorPayload;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

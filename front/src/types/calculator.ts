export type Operation =
  | 'add'
  | 'subtract'
  | 'multiply'
  | 'divide'
  | 'power'
  | 'sqrt'
  | 'percentage';

export type Operands = [number] | [number, number];

export interface CalculateRequest {
  operation: Operation;
  operands: Operands;
}

export interface CalculateResponse {
  operation: Operation;
  operands: Operands;
  result: number;
}

export interface ApiErrorPayload {
  error: string;
  message: string;
  details?: Record<string, unknown> | null;
}

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

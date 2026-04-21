import { request } from './client';
import type {
  CalculateRequest,
  CalculateResponse,
} from '../types/calculator';

/**
 * Calls POST /api/v1/calculate on the backend and returns the parsed response.
 */
export function calculate(
  req: CalculateRequest,
): Promise<CalculateResponse> {
  return request<CalculateResponse>('/api/v1/calculate', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

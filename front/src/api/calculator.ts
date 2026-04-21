import { request } from './client';
import type {
  CalculateRequest,
  CalculateResponse,
} from '../types/calculator';

export function calculate(
  req: CalculateRequest,
): Promise<CalculateResponse> {
  return request<CalculateResponse>('/api/v1/calculate', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

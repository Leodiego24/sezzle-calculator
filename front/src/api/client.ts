import { ApiError, type ApiErrorPayload } from '../types/calculator';

export function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (typeof fromEnv === 'string' && fromEnv.length > 0) {
    return fromEnv;
  }
  return 'http://localhost:8000';
}

export async function request<TResponse>(
  path: string,
  init: RequestInit = {},
): Promise<TResponse> {
  const url = `${getApiBaseUrl()}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw new Error('Network request failed');
  }

  if (!response.ok) {
    let payload: ApiErrorPayload;
    try {
      payload = (await response.json()) as ApiErrorPayload;
    } catch {
      payload = {
        error: 'internal_error',
        message: `Request failed with status ${response.status}`,
        details: null,
      };
    }
    throw new ApiError(response.status, payload);
  }

  return (await response.json()) as TResponse;
}

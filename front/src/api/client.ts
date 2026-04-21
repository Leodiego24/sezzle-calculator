import { ApiError, type ApiErrorPayload } from '../types/calculator';

/**
 * Resolve the backend base URL from Vite env, falling back to localhost.
 */
export function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (typeof fromEnv === 'string' && fromEnv.length > 0) {
    return fromEnv;
  }
  return 'http://localhost:8000';
}

/**
 * Minimal fetch wrapper that:
 *   - Prepends the configured base URL.
 *   - Sends/receives JSON.
 *   - Throws ApiError on non-2xx responses that return a JSON error body.
 *   - Throws a generic Error on network failures.
 */
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

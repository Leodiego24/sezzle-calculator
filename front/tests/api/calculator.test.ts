import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculate } from '../../src/api/calculator';
import { ApiError } from '../../src/types/calculator';

describe('api/calculator', () => {
  const fetchMock = vi.fn();
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    fetchMock.mockReset();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('parses a successful 200 response', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          operation: 'add',
          operands: [2, 3],
          result: 5,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    const res = await calculate({ operation: 'add', operands: [2, 3] });
    expect(res).toEqual({
      operation: 'add',
      operands: [2, 3],
      result: 5,
    });

    const call = fetchMock.mock.calls[0];
    expect(call[0]).toMatch(/\/api\/v1\/calculate$/);
    expect(call[1].method).toBe('POST');
    expect(JSON.parse(call[1].body)).toEqual({
      operation: 'add',
      operands: [2, 3],
    });
  });

  it('throws an ApiError with the parsed payload on non-2xx', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: 'division_by_zero',
          message: 'Cannot divide by zero',
          details: null,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    await expect(
      calculate({ operation: 'divide', operands: [1, 0] }),
    ).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      payload: {
        error: 'division_by_zero',
        message: 'Cannot divide by zero',
      },
    });
  });

  it('falls back to a generic ApiError when the body is not JSON', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('plain text', {
        status: 500,
      }),
    );

    const err = await calculate({
      operation: 'add',
      operands: [1, 2],
    }).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(500);
    expect((err as ApiError).payload.error).toBe('internal_error');
  });

  it('throws a generic Error on network failure', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('offline'));

    await expect(
      calculate({ operation: 'add', operands: [1, 2] }),
    ).rejects.toThrowError('Network request failed');
  });
});

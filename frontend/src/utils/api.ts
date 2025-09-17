import { toast } from 'sonner';

export type ApiErrorCause = 'network' | 'timeout' | 'server' | 'client' | 'unknown';

export class ApiError extends Error {
  status?: number;
  url?: string;
  causeType: ApiErrorCause;
  details?: any;

  constructor(message: string, opts?: { status?: number; url?: string; causeType?: ApiErrorCause; details?: any }) {
    super(message);
    this.name = 'ApiError';
    this.status = opts?.status;
    this.url = opts?.url;
    this.causeType = opts?.causeType ?? 'unknown';
    this.details = opts?.details;
  }
}

interface CallOptions {
  timeoutMs?: number;
  retries?: number; // retries for network/server errors only
  retryDelayMs?: number;
  showToastOnError?: boolean;
}

// Utility sleep
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

// Best-effort extraction of error info from a Response
async function extractErrorInfo(res: Response): Promise<{ message: string; details?: any }> {
  const contentType = res.headers.get('content-type') || '';
  try {
    if (contentType.includes('application/json')) {
      const data = await res.json();
      const message = data?.detail || data?.message || `HTTP ${res.status} ${res.statusText}`;
      return { message, details: data };
    } else {
      const text = await res.text();
      const message = text || `HTTP ${res.status} ${res.statusText}`;
      return { message };
    }
  } catch {
    return { message: `HTTP ${res.status} ${res.statusText}` };
  }
}

export async function callBrain<T>(fn: () => Promise<Response>, options: CallOptions = {}): Promise<T> {
  const { timeoutMs = 12000, retries = 1, retryDelayMs = 800, showToastOnError = false } = options;

  let attempt = 0;
  // Exponential backoff
  const getDelay = (i: number) => Math.min(retryDelayMs * 2 ** i, 3000);

  // Wrap a single attempt with timeout
  const attemptOnce = async (): Promise<T> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      const id = setTimeout(() => {
        clearTimeout(id);
        reject(new ApiError('Request timed out', { causeType: 'timeout' }));
      }, timeoutMs);
    });

    try {
      const res = (await Promise.race([fn(), timeoutPromise])) as Response;
      if (!res.ok) {
        const { message, details } = await extractErrorInfo(res);
        const causeType: ApiErrorCause = res.status >= 500 ? 'server' : 'client';
        throw new ApiError(message, { status: res.status, url: res.url, causeType, details });
      }
      // Try to parse JSON, but allow empty responses
      try {
        return (await res.json()) as T;
      } catch {
        return undefined as T;
      }
    } catch (err: any) {
      // Normalize fetch/network errors
      if (!(err instanceof ApiError)) {
        const isTimeout = err?.causeType === 'timeout' || err?.name === 'AbortError';
        if (isTimeout) throw err;
        throw new ApiError(err?.message || 'Network error', { causeType: 'network' });
      }
      throw err;
    }
  };

  while (true) {
    try {
      return await attemptOnce();
    } catch (err: any) {
      attempt++;
      const isRetriable = err instanceof ApiError && (err.causeType === 'network' || err.causeType === 'server');
      if (attempt > retries || !isRetriable) {
        if (showToastOnError) {
          const statusLabel = err?.status ? ` (HTTP ${err.status})` : '';
          toast.error(`Request failed${statusLabel}: ${err?.message || 'Unknown error'}`);
        }
        throw err;
      }
      await sleep(getDelay(attempt - 1));
    }
  }
}

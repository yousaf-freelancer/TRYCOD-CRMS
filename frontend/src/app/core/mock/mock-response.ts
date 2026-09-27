import { Observable, delay, of, throwError, timer, switchMap } from 'rxjs';

/** Simulated network latency for mock responses. */
export const MOCK_LATENCY_MS = 300;

/**
 * Wraps a value in an Observable that behaves like an HTTP response:
 * async, delayed and deep-copied so callers can't mutate the in-memory DB.
 */
export function mockResponse<T>(value: T, ms = MOCK_LATENCY_MS): Observable<T> {
  return of(structuredClone(value)).pipe(delay(ms));
}

/** Lazily computes the value at subscription time (keeps derived data fresh). */
export function mockCompute<T>(factory: () => T, ms = MOCK_LATENCY_MS): Observable<T> {
  return timer(ms).pipe(switchMap(() => of(structuredClone(factory()))));
}

export function mockError(message: string, ms = MOCK_LATENCY_MS): Observable<never> {
  return timer(ms).pipe(switchMap(() => throwError(() => new Error(message))));
}

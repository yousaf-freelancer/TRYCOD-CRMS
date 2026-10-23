import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

type QueryValue = string | number | boolean | null | undefined | readonly (string | number)[];
export type QueryParams = Record<string, QueryValue>;

/**
 * Thin HttpClient wrapper for the NestJS API (`environment.apiUrl`).
 * - Reads (`get`) never throw: any failure resolves to the given fallback so
 *   pages fall back to their empty states while endpoints are being built.
 * - Writes throw an `Error` whose message is the backend's error message.
 */
@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);

  get<T>(path: string, fallback: T, params?: QueryParams): Observable<T> {
    return this.http
      .get<T>(apiUrl(path), { params: toParams(params) })
      .pipe(catchError(() => of(fallback)));
  }

  post<T>(path: string, body: unknown = {}): Observable<T> {
    return this.http.post<T>(apiUrl(path), body).pipe(catchError(rethrow));
  }

  patch<T>(path: string, body: unknown = {}): Observable<T> {
    return this.http.patch<T>(apiUrl(path), body).pipe(catchError(rethrow));
  }

  put<T>(path: string, body: unknown = {}): Observable<T> {
    return this.http.put<T>(apiUrl(path), body).pipe(catchError(rethrow));
  }

  delete<T = void>(path: string): Observable<T> {
    return this.http.delete<T>(apiUrl(path)).pipe(catchError(rethrow));
  }
}

export function apiUrl(path: string): string {
  return `${environment.apiUrl}/${path.replace(/^\/+/, '')}`;
}

/** Converts an HTTP failure into an `Error` carrying the backend's message. */
export function toApiError(err: unknown): Error {
  if (!(err instanceof HttpErrorResponse)) {
    return err instanceof Error ? err : new Error('Something went wrong. Please try again.');
  }
  const body = err.error as { message?: string | string[] } | string | null;
  const message = typeof body === 'string' ? body : body?.message;
  if (Array.isArray(message) && message.length) return new Error(message.join(' '));
  if (typeof message === 'string' && message.trim()) return new Error(message);
  if (err.status === 0) return new Error('Cannot reach the server. Check your connection.');
  if (err.status === 404) return new Error('This feature is not available yet.');
  return new Error('Something went wrong. Please try again.');
}

function rethrow(err: unknown): Observable<never> {
  return throwError(() => toApiError(err));
}

function toParams(params?: QueryParams): HttpParams | undefined {
  if (!params) return undefined;
  let result = new HttpParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue;
    if (Array.isArray(value)) value.forEach((v) => (result = result.append(key, String(v))));
    else result = result.set(key, String(value));
  }
  return result;
}

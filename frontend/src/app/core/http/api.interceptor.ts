import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'trycod.token';

/**
 * Placeholder interceptor for the future NestJS API:
 * - prefixes relative `api/...` URLs with `environment.apiUrl`
 * - attaches a Bearer token when one exists
 * No request is made today — services still return mock data.
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const url = req.url.startsWith('api/') ? `${environment.apiUrl}/${req.url.slice(4)}` : req.url;
  let token: string | null = null;
  try {
    token = localStorage.getItem(TOKEN_KEY);
  } catch {
    token = null;
  }
  const headers = token ? req.headers.set('Authorization', `Bearer ${token}`) : req.headers;
  return next(req.clone({ url, headers }));
};

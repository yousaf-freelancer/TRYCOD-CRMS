# Trycod Tech School — Institute Management (frontend)

Angular 22 frontend for admissions, students, fees, attendance, HRMS, mentor reports and sales calls.
Everything runs on in-memory mock data, so it can be demoed without a backend.

## Requirements

- **Node.js 22.22.3 or newer** (Angular 22 does not run on Node 20). With nvm-windows: `nvm install 22` then `nvm use 22.23.3`.
- npm 10+

## Run

```bash
npm install
npm start          # http://localhost:4200
npm run build      # production build → dist/web
```

## Demo accounts

The login page has demo chips that fill these in (they don't submit on their own):

| Role    | Email                     | Password     | Lands on    |
| ------- | ------------------------- | ------------ | ----------- |
| Admin   | admin@trycod-demo.com     | Admin@123    | /dashboard  |
| Advisor | advisor@trycod-demo.com   | Advisor@123  | /dashboard  |
| Mentor  | mentor@trycod-demo.com    | Mentor@123   | /dashboard  |
| Sales   | sales@trycod-demo.com     | Sales@123    | /dashboard  |
| Student | student@trycod-demo.com   | Student@123  | /portal     |

## Before a client demo

1. **Logo** — put the logo at `public/images/trycod-logo.png`. Until then a text wordmark is shown.
   The logo is always rendered height-driven with `width: auto; object-fit: contain`, so it keeps its proportions.
2. **PrimeNG licence** — PrimeNG 22 is published under the PrimeUI licence and shows a red
   "Invalid PrimeUI License" badge unless a key is configured. Get a key (a free Community licence exists
   for small teams — check eligibility at https://primeui.dev/licenses) and set it in
   `src/environments/environment.ts` and `environment.development.ts`:

   ```ts
   primeLicenseKey: 'your-key',
   ```

## Project structure

```
src/app/
├── core/          auth (mock AuthService, guards), layout (shell, sidebar, header, portal shell),
│                  navigation (nav.config.ts = single source for sidebar + route roles),
│                  http (API interceptor placeholder), mock (MockDb, derive helpers), theme (PrimeNG preset, icons)
├── shared/        ui (page-header, stat-card, status-badge, empty-state, confirm dialog, tables…), pipes, utils, charts
├── models/        TypeScript interfaces for every entity (Student, Lead, Payment, PayrollEntry, …)
├── features/      one folder per area, each with a data-access/ service + lazy-loaded pages
└── mock-data/     seed data generators (only imported by MockDb / services)
```

## Connecting the NestJS API

Components never touch mock data — they only call the feature services in `features/*/data-access/`.
Each service method already returns an `Observable` and has a comment naming the future endpoint.
To switch a service:

```ts
// before
getStudents(filters: StudentFilters = {}): Observable<StudentListItem[]> {
  return mockCompute(() => …);
}

// after
private readonly http = inject(HttpClient);
getStudents(filters: StudentFilters = {}): Observable<StudentListItem[]> {
  return this.http.get<StudentListItem[]>('api/students', { params: { ...filters } });
}
```

- `provideHttpClient()` and `apiInterceptor` (prefixes `api/…` with `environment.apiUrl`, adds a Bearer token) are already registered.
- Aggregations currently in `core/mock/derive.ts` (fee status, attendance %, payroll LOP) belong in the API.
- Replace `AuthService.login()` with a real JWT call; keep its `user` / `role` signals so guards and the sidebar keep working.
- When every service is switched, delete `core/mock/` and `mock-data/`.

## Roles & navigation

`core/navigation/nav.config.ts` maps every sidebar item to allowed roles, and exports `ROUTE_ROLES`
used by `roleGuard` in `app.routes.ts`, so the sidebar and route protection can't drift apart.

## Icons

Icons come from `@lucide/angular` and are registered by name in `core/theme/icons.ts`.
After adding a new `lucideIcon="…"` name, regenerate the registry:

```bash
npm run icons
```

## Notes

- Mock data is generated relative to today's date, so the demo always looks current.
  On Sundays (weekly off) dashboards show the last working day.
- Create / edit / delete actions work against in-memory state and reset on page reload.
- Biometric device sync and telephony sync are shown as "coming soon" placeholders.

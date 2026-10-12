# Dashboard

Arabic-first CodeTech admin starter. The UI follows the supplied login, verification, and homepage-management screens, and the project is structured as a standalone Angular application.

Angular 22 requires Node `^24.15.0`. This machine is on Node `24.12.0`, so the app uses the latest compatible stable line: **Angular 21.2**.

## Stack

- Angular 21.2.25 (`@angular/cli` 21.2.26), TypeScript 5.9.3
- PrimeNG 21.1.10 with the Aura preset from `@primeuix/themes` 2.0.3
- PrimeIcons 7.0.0 and Angular CDK 21.2.14
- Bootstrap 5.3.8 grid and utilities only
- SCSS design tokens in `src/styles`
- Zoneless standalone components, signals, RxJS, and reactive forms

Angular 22 is not used because it requires Node `^22.22.3 || ^24.15.0 || >=26`. This environment is Node 24.12.0.

## Run

```bash
# from the folder that contains package.json
npm install
npm start
```

Open `http://localhost:4200`.

```bash
npm run build          # production bundle
npm test               # Vitest suite (single run)
npm run format         # Prettier --write
npm run format:check   # Prettier --check (use this in CI)
```

There is no ESLint target yet; formatting is Prettier (`.prettierrc`, `.editorconfig`). Node must satisfy `engines` in `package.json` (Angular 21: `^20.19.0 || ^22.12.0 || >=24.0.0`).

## Demo access

There is no backend. In **development** (`npm start`) the mock auth accepts any valid email with:

- Password: `12345678`
- Verification code: `1111`

These credentials live only in `src/environments/environment.ts`. The **production** build (`environment.production.ts`) ships without them, so signing in there reports "Sign-in is currently unavailable" until `AuthService` is replaced by a real API client.

`authInterceptor` attaches the bearer token only to requests under `environment.apiUrl` and signs the user out on a `401` response.

### Remember me

The "Remember me" checkbox on the login page is **cosmetic** today. Its state is not passed to `AuthService` and nothing is persisted because of it.

- The mock session (`codetech.session`) and pending login (`codetech.pending`) live in `sessionStorage`, so they end when the tab closes, whether or not the box is ticked.
- The password is never stored anywhere (covered by a test in `auth.service.spec.ts`).
- The mock token is generated on the client, so it must not be copied to `localStorage` to fake persistence.

Intended behavior once a real API exists: a ticked box asks the server for a long-lived session, delivered as an `HttpOnly; Secure; SameSite` refresh cookie. The app then restores the short-lived access token from that cookie on startup. An unticked box keeps the current tab-scoped session. This depends on the backend issuing, rotating and revoking that cookie, and on logout clearing it.

## Layout

- `src/app/core` — auth, guards, interceptor, preferences, navigation
- `src/app/layout` — admin shell, sidebar, header, auth split screen
- `src/app/features/dashboard` — homepage management from the reference screen
- `src/app/features/users` — searchable, sortable user table with mock CRUD
- `src/app/features/settings` — theme, language, density, and sidebar preference
- `src/styles` — tokens, light/dark themes, shared components, and layout/page partials (`layout/*`, `pages/home`)

The sidebar also opens the remaining CodeTech sections as routed placeholders so navigation matches the reference without inventing unfinished CRUD modules.

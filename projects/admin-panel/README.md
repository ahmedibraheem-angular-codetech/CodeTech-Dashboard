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
cd ~/Desktop/Dashboard
npm start
```

Open `http://localhost:4200`.

```bash
npm run build
npm test -- --watch=false
```

`npm run build` completes the production bundle. `npm test -- --watch=false` runs the Vitest suite (app shell, auth, and users). There is no ESLint target; formatting is Prettier.

## Demo access

There is no backend. Mock auth accepts any valid email with:

- Password: `12345678`
- Verification code: `1111`

Replace `src/environments` and `AuthService` before connecting a real API. `authInterceptor` already attaches a bearer token for future HTTP calls.

## Layout

- `src/app/core` — auth, guards, interceptor, preferences, navigation
- `src/app/layout` — admin shell, sidebar, header, auth split screen
- `src/app/features/dashboard` — homepage management from the reference screen
- `src/app/features/users` — searchable, sortable user table with mock CRUD
- `src/app/features/settings` — theme, language, density, and sidebar preference
- `src/styles` — tokens, light/dark themes, and shared component styles

The sidebar also opens the remaining CodeTech sections as routed placeholders so navigation matches the reference without inventing unfinished CRUD modules.

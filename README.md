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

Login talks to `POST /admin/auth/login` on `environment.apiUrl`. After a successful password check the app still shows the existing OTP screen. That screen is a **frontend-only gate**: it accepts the static code `1111` (`TEMPORARY_DEMO_OTP`) and does not call a backend OTP endpoint. It is not two-factor authentication.

`authInterceptor` attaches the bearer token only to requests under `environment.apiUrl` and signs the user out on a `401` response.

### Remember me

The checkbox is sent as `remember` on login. The backend token lasts 1 day when it is off, and 30 days when it is on. There is no refresh-token or cookie flow.

- Off: the session is stored in `sessionStorage` (`codetech.session`) and ends when the tab closes.
- On: the session is stored in `localStorage` and survives a browser restart, up to the 30-day token.
- The pending login (`codetech.pending`) always stays in `sessionStorage` and is not a live session. The token is written to the session store only after OTP succeeds and `GET /admin/profile` succeeds.
- The password is never stored (covered by a test in `auth.service.spec.ts`).
- Only a lean session subset is persisted (`token`, `email`, `name`, `roleKey`, `remember`). Avatar URL, permissions, phone, username, and `last_login_at` stay in memory and are refreshed from `GET /admin/profile`.
- Profile page edits (personal data, password, avatar upload) are still mock-backed; they must not fight the hydrated auth identity once profile has loaded.

## UI conventions (PrimeNG first)

PrimeNG is the primary component library. Reach for a PrimeNG component before writing a custom one:

| Need                                        | Use                                                                                    |
| ------------------------------------------- | -------------------------------------------------------------------------------------- |
| Buttons, icon buttons                       | `p-button` (or `pButton` on an `<a>` or when the native element needs ARIA attributes) |
| Text, search, textarea                      | `pInputText` / `pTextarea`, with `p-iconfield` + `p-inputicon` for icons               |
| Select, date, OTP, switch, segmented choice | `p-select`, `p-datepicker`, `p-inputotp`, `p-toggleswitch`, `p-selectbutton`           |
| Table, paging, sorting                      | `p-table` (`[paginator]`, `pSortableColumn`)                                           |
| Dialogs, menus, popovers, toasts, tooltips  | `p-dialog`, `p-menu`, `p-popover`, `p-toast`, `pTooltip`                               |
| Status chips, spinners, uploads             | `p-tag`, `p-progress-spinner`, `p-fileupload`                                          |

Rules of thumb:

- Make form controls full width with their `[fluid]="true"` input, not with global CSS.
- Icon-only buttons need an `ariaLabel` (and usually a `pTooltip`).
- `p-password` is not used: its show/hide toggle is a click-only SVG without a label or keyboard support. The login form uses a `p-button` inside a `p-iconfield` instead.
- Bootstrap is limited to the grid and utilities (`vendors/_bootstrap.scss`); it never replaces a PrimeNG component.

### Theming

- **One place to restyle the product:** `src/app/core/theme/app-theme.ts` (a PrimeNG preset on top of Aura). Change the `primary` palette there; `--app-primary` in SCSS is an alias of `--p-primary-500`, so SCSS follows automatically. Shared radius and padding of inputs/buttons are in the same file (`formField`), and per-component tokens go under `components`.
- Tweak a single instance with scoped design-token CSS variables (for example `.auth-submit { --p-button-primary-background: … }` in `styles/components/_buttons.scss`) instead of overriding PrimeNG selectors. There is no `!important` in component styles.
- App-level tokens (`--app-*`: spacing, surfaces, sidebar, shadows) live in `src/styles/themes/_light-theme.scss`. The app is light only; dark mode is disabled (`darkModeSelector: false` in `app.config.ts`).
- Intentionally still custom: the sidebar navigation tree, the user chip, the notification list and the auth language pill. They are composite widgets with no matching PrimeNG component.

## Layout

- `src/app/core` — auth, guards, interceptor, preferences, navigation
- `src/app/layout` — admin shell, sidebar, header, auth split screen
- `src/app/features/dashboard` — homepage management from the reference screen
- `src/app/features/users` — searchable, sortable user table with mock CRUD
- `src/app/features/settings` — language, density, and sidebar preference
- `src/styles` — tokens, light theme, shared components, and layout/page partials (`layout/*`, `pages/home`)

The sidebar also opens the remaining CodeTech sections as routed placeholders so navigation matches the reference without inventing unfinished CRUD modules.

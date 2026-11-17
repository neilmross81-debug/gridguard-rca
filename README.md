# GridGuard RCA — web app

Root cause analysis and corrective action tracking for HV and renewable
operations: 5 Whys, Ishikawa 6M, FMEA risk scoring and a tracked CAPA plan.

**Live: https://neilmross81-debug.github.io/gridguard-rca/**

## This revision

A redesign of the original Flutter web build. The Flutter bundle laid out as a
fixed two-column phone grid stretched across the desktop viewport, which left
each metric card mostly empty. This version is a static single-page app:

- fluid content container with a proper desktop layout instead of a stretched
  phone grid
- no build step and no runtime downloads — the whole app is ~40 KB, against
  roughly 10 MB on a cold load of the Flutter bundle
- same storage schema, so existing local data is picked up untouched

## Data

Local-first: everything lives in `localStorage` under `gridguard_rca_store_v1`.
Settings can mirror changes to your own Apps Script web app URL.

## Restoring the Flutter build

The Flutter web build is preserved at the `flutter-web-build` branch and the
`flutter-web-v1.0.0` tag.

    git checkout flutter-web-build

It expects to be served from `/gridguard-rca/`, which is why its `index.html`
contains `<base href="/gridguard-rca/">`.

Not affiliated with or endorsed by any employer.

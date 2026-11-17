# GridGuard RCA — web build

Static Flutter web build of GridGuard RCA (Industrial Root Cause Analysis, HV & Renewable Operations).

Hosted with GitHub Pages at:

**https://analyticalresearchsystemseng-jpg.github.io/gridguard-rca/**

This repository contains the **compiled web bundle only** (no Dart source).
It is a client-side app: all data lives in the browser's local storage.
Outbound integrations (Google Drive backup, Apps Script webhook) are configured
inside the app's own Settings screen and are blank in this build.

The build expects to be served from the `/gridguard-rca/` sub-path, which is why
`index.html` contains `<base href="/gridguard-rca/">`. Moving it to a root-domain
host requires changing that line to `/`.

Not affiliated with or endorsed by any employer.

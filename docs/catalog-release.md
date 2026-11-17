# Catalog release preparation

## Version 0.1.0 — November 17, 2026

- Builds using plain `busy-cli build` with the committed npm lockfile; generated assets are committed and no custom build hooks are required.
- MIT license for application code and original artwork; bundled third-party assets retain their own notices and licenses in the source tree and package.
- Formatting, package runtime tests (13 tests), and syntax/manifest checks pass.
- Installed and exercised in the official BUSY Bar Emulator at normal Bar speed, firmware 1.3.1 / API 27.14.0. No app runtime errors were observed during the captured scenarios.
- Native screenshots and capture provenance are in `screenshots/`.
- Catalog automation will perform its own isolated build and hardware review. Local emulator checks do not assert compatibility with every future firmware release.

The repository is prepared for public publication. A catalog submission must pin the source commit, and the author must accept the catalog terms before opening its PR.

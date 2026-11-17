# Third-party notices

Application code and original artwork are Copyright (c) 2026 Yury Molodtsov, under the MIT license in LICENSE.

## Embedded pixel-font data

`shared/font.js` contains a converted subset of the BUSY pixel fonts from BUSY Bar firmware 1.3.1, commit `8edd2da42ed2facbab73796c456746e7dcbed2e7`.

- Upstream: https://github.com/busy-app/busybar-firmware/tree/1.3.1/assets/shared/fonts/ttf
- Copyright 2024–2026 Flipper FZCO.
- License: SIL Open Font License 1.1, identified in the upstream TTF license metadata and firmware LICENSE.md.
- Changes: selected glyphs converted from TTF outlines to compact one-bit bitmap records; no original TTF files are bundled.
- The font data remains under OFL-1.1 and is excluded from the application code's MIT license. The full license is in LICENSES/OFL-1.1.txt and is included in the app package as resources/OFL-1.1.txt.

The original BUSY font names appear only to identify their source and match the firmware's API font names. This app is independently developed and is not an official BUSY app.

Development dependencies retain their own licenses and are not included as runtime dependencies in the device package.

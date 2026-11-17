# Screenshot provenance

Captured on November 17, 2026 from the official BUSY Bar Emulator, repository `busy-app/busybar-emulator`, commit `bee02f7e79c1cf51931a0d1c1b5b22903fea146b`, running firmware 1.3.1 / API 27.14.0 at the emulator's normal BUSY Bar speed.

The app was built with plain `busy-cli build` from this source tree and installed with its install script. Screenshots were read from the emulator's `/api/screen` framebuffer and converted losslessly from BGR888 (front) or packed grayscale (back) to PNG using the official catalog's `tools.bar.save_screen`. These are actual app captures, not simulator mockups or synthesized frames.

Front screenshots (72×16): running.png, jump.png, ready.png, game-over.png.

Rear screenshots (160×80): ready-back.png.

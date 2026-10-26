# PWA deep links for player profiles

The web manifest declares a root scope and a stable launch URL. Shared player URLs remain ordinary HTTPS URLs, so browsers that support opening eligible links in an installed web app can keep navigation in the app context. Other browsers open the same route in a normal browser tab.

## Platform limitations

Manifest fields alone do **not** force every platform to open a shared link in an installed PWA. The operating system and browser decide whether to associate an HTTPS link with an installed web app. Android Digital Asset Links requires the production Android application/package identity and signing-certificate fingerprint; those values must come from the app owner and must not be guessed. No `assetlinks.json` is included until those values are confirmed.

The app's locale middleware redirects unprefixed routes to the selected locale while preserving the URL query string. A player profile link therefore remains a player profile route rather than being replaced with the PWA launch page.

## Verification status

- Manifest syntax and values are committed in `public/manifest.json`.
- Automated CI should validate the project build and existing PWA asset checks.
- Opening a shared profile from a messaging app with the PWA installed has **not** been device-tested in this change. Verify on supported Android/Chrome versions and iOS/Safari separately before claiming platform association is confirmed.

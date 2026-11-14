# Release signing

Release builds come from `.github/workflows/release.yml`. It signs each platform when that
platform's secrets are set, and builds unsigned when they are not, so a missing certificate
never blocks a release.

| Platform | Status | What the user sees when unsigned |
| --- | --- | --- |
| Android | **Signed** with the project's release key | — |
| Windows | Ready; needs a certificate (below) | SmartScreen "Windows protected your PC" → More info → Run anyway |
| macOS | Ready; needs an Apple Developer ID (below) | "can't be opened" → right-click the app → Open |
| Linux | Not needed: AppImage, .deb and .rpm are verified with `SHA256SUMS.txt` | — |

Every release also includes `SHA256SUMS.txt`, so any download can be checked against the
build that GitHub Actions produced.

## In-app updates (desktop)

The desktop apps update themselves from GitHub releases with Tauri's updater: they read
`latest.json` from the latest release, download the new installer (NSIS/MSI on Windows, the
app bundle on macOS, the AppImage on Linux), check its signature against the public key in
`src-tauri/tauri.conf.json` (`plugins.updater.pubkey`), install it and restart. The portable
Windows zip and Linux .deb/.rpm installs are pointed to the download page instead, as is the
Android app (it installs over itself because the APK key never changes).

The workflow builds the signed updater files and `latest.json` only when these secrets are set:

| Secret | Value |
| --- | --- |
| `TAURI_SIGNING_PRIVATE_KEY` | the private key file's contents (`qalam-updater.key`) |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | its password |

Without them a release still builds; the apps then fall back to telling users about the new
version and opening its download page.

Keep the private key **outside this repository** and back it up. Installed apps only accept
updates signed with it; if it's lost, make a new pair, put the new public key in
`tauri.conf.json`, and users must install that release by hand once. To make a pair:

```bash
npx tauri signer generate -w qalam-updater.key       # asks for a password
gh secret set TAURI_SIGNING_PRIVATE_KEY < qalam-updater.key
gh secret set TAURI_SIGNING_PRIVATE_KEY_PASSWORD
cat qalam-updater.key.pub                            # → plugins.updater.pubkey
```

## Android

The APK is a release build, signed with `apksigner` (APK signature scheme v2/v3) using the
project's key (alias `qalam`, set in the workflow):

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | the PKCS#12 keystore, base64-encoded |
| `ANDROID_KEYSTORE_PASSWORD` | its password |

The keystore itself is kept **outside this repository**. Back it up: Android only installs an
update over an existing app when it's signed with the same key. If the key is lost, every user
has to uninstall and reinstall, and a Play Store listing could never be updated.

Certificate SHA-256 fingerprint (to check a downloaded APK with
`apksigner verify --print-certs`):

```
A9:8E:84:1A:F2:78:76:36:8C:FA:25:18:90:35:4F:1F:3B:24:51:99:7D:CD:E4:84:9F:69:07:67:05:2C:A1:EA
```

To make a new key (only for a fork; it would replace this one):

```bash
openssl req -x509 -newkey rsa:4096 -sha256 -days 10950 -nodes \
  -keyout key.pem -out cert.pem -subj "/CN=Your Name"
openssl pkcs12 -export -name qalam -inkey key.pem -in cert.pem -out release.p12
base64 -w0 release.p12 | gh secret set ANDROID_KEYSTORE_BASE64
gh secret set ANDROID_KEYSTORE_PASSWORD
```

## Windows: Azure Trusted Signing

Microsoft's [Trusted Signing](https://learn.microsoft.com/azure/trusted-signing/) is the
cheapest way to get a certificate that SmartScreen trusts (a monthly Azure subscription,
identity-validated). The workflow installs `trusted-signing-cli` and has Tauri sign the app
and its installers with it.

1. Create a Trusted Signing account and a certificate profile in Azure, and an app
   registration (service principal) with the *Trusted Signing Certificate Profile Signer* role.
2. Add the repository **secrets** `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` and `AZURE_TENANT_ID`.
3. Add the repository **variables** `AZURE_SIGNING_ENDPOINT` (for example
   `https://eus.codesigning.azure.net`), `AZURE_SIGNING_ACCOUNT` and `AZURE_CERT_PROFILE`.

## macOS: Developer ID and notarization

Needs an [Apple Developer Program](https://developer.apple.com/programs/) membership.

1. Create a **Developer ID Application** certificate and export it from Keychain Access as a
   `.p12`.
2. Add the repository secrets:

   | Secret | Value |
   | --- | --- |
   | `APPLE_CERTIFICATE` | `base64 -i certificate.p12` |
   | `APPLE_CERTIFICATE_PASSWORD` | the `.p12` export password |
   | `APPLE_SIGNING_IDENTITY` | e.g. `Developer ID Application: Uzair Asad (TEAMID)` |
   | `APPLE_ID` | your Apple ID email (for notarization) |
   | `APPLE_PASSWORD` | an [app-specific password](https://support.apple.com/102654) |
   | `APPLE_TEAM_ID` | your 10-character team ID |

Tauri then signs, notarizes and staples the `.app` and `.dmg`.

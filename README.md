# Photo Map

Photo Map is a mobile-first web application for uploading geotagged photos and viewing them on an interactive map. Users sign in with Google, upload JPEG, HEIC, or HEIF photos, and see only their own photo locations and protected thumbnails.

The application requests only the Google identity scopes `openid`, `email`, and `profile`. It does not read Gmail or Google Drive.

## Features

- Google OAuth/OIDC authentication with database-backed sessions
- Private, owner-scoped photo storage outside `public/`
- Uploads of 1–10 photos, up to 15 MiB each
- Server-side file validation, EXIF GPS extraction, and metadata-free JPEG thumbnails
- Per-user duplicate detection using an MD5 hash of the original file bytes
- MapLibre map with count-labelled marker clusters, protected thumbnails, dates, and coordinates
- Installable PWA with a RAIL PM icon and iPhone Add to Home Screen guidance
- Responsive controls tested with an iPhone 16 Pro Max viewport and a physical iPhone
- Public deployment under the `/pm` base path through IIS ARR
- Google sign-in tested with both organization and general Gmail accounts

## Architecture

| Area | Technology |
| --- | --- |
| Application | Next.js App Router, React, strict TypeScript |
| Authentication | Auth.js with Google Provider |
| Database | Prisma with SQLite |
| Photo storage | Local persistent `storage/` directory |
| Image processing | Sharp and exifr |
| Map | MapLibre GL JS and OpenFreeMap |
| Tests | Vitest |

This deployment model requires a persistent Ubuntu server. Do not deploy it to ephemeral or serverless storage without first moving the database and photos to persistent external services.

## Ubuntu Setup

Run these commands in an Ubuntu terminal from the project directory. `pwd` should show the cloned `photo-map` directory, such as `/home/boss/codex/photo-map`.

```bash
pwd
nvm use
npm ci
cp .env.example .env.local
npx auth secret
npm run db:migrate
npm run db:backfill-hashes
```

`npm ci` should finish without errors, and Prisma should report that the database schema is in sync. If `nvm` is unavailable, run `source ~/.bashrc` and then check `command -v nvm`.

`db:backfill-hashes` assigns duplicate keys to legacy photos without moving or deleting their files. Stop the production server and back up both `dev.db` and `storage/` before running it on an existing deployment. Existing duplicate rows are reported and left unchanged.

Edit `.env.local` on the Ubuntu server. Never commit or share its real secrets.

```dotenv
AUTH_SECRET=replace-with-a-random-development-secret
AUTH_GOOGLE_ID=replace-with-google-oauth-client-id
AUTH_GOOGLE_SECRET=replace-with-google-oauth-client-secret
AUTH_URL=https://rail.wke.csie.ncnu.edu.tw
NEXT_PUBLIC_BASE_PATH=/pm
DATABASE_URL=file:./dev.db
UPLOAD_ROOT=./storage
NEXT_PUBLIC_MAP_STYLE_URL=https://tiles.openfreemap.org/styles/liberty
```

`AUTH_URL` contains only the public origin. The application configures the Auth.js endpoint at `/pm/api/auth`.

## Google OAuth Configuration

Configure the OAuth application in Google Auth Platform:

- Audience: `External`
- Scopes: `openid`, `email`, and `profile` only
- Authorized JavaScript origin: `https://rail.wke.csie.ncnu.edu.tw`
- Authorized redirect URI: `https://rail.wke.csie.ncnu.edu.tw/pm/api/auth/callback/google`

An `Internal` audience blocks general Gmail accounts with `403 org_internal`. Do not add Gmail or Drive scopes; this application does not need them.

For root-path local development without `/pm`, leave `NEXT_PUBLIC_BASE_PATH` empty and use this callback:

```text
http://localhost:3000/api/auth/callback/google
```

## Run Locally on Ubuntu

Run these commands in an Ubuntu terminal:

```bash
pwd
npm run dev
```

When `NEXT_PUBLIC_BASE_PATH=/pm`, open `http://localhost:3000/pm`. When it is empty, open `http://localhost:3000`.

`NEXT_PUBLIC_BASE_PATH` is embedded at build time. Always rebuild after changing it.

## Install the App

The public HTTPS site includes an **Install App** button. Browsers that support an install prompt
open it directly. Apple does not permit websites to trigger the iPhone installation dialog, so the
button shows the required steps: tap **Share**, **Add to Home Screen**, then **Add**.

The service worker caches only versioned application assets and icons. Authentication responses,
photo metadata, thumbnails, and GPS data are never stored in the PWA cache. The app still requires
a network connection to sign in, upload photos, or load the map.

## Production Server

Run these commands in an Ubuntu terminal:

```bash
pwd
npm run db:deploy
npm run db:backfill-hashes
npm run build
npm run start -- -H 0.0.0.0 -p 3000
```

Use a process supervisor such as systemd for long-running production service. Do not expose the development server publicly.

## IIS ARR Reverse Proxy

The public application URL is:

```text
https://rail.wke.csie.ncnu.edu.tw/pm
```

IIS must preserve `/pm` when forwarding requests. The request filtering limit below allows the
application's maximum batch of ten 15 MiB photos plus multipart overhead:

```xml
<security>
  <requestFiltering>
    <requestLimits maxAllowedContentLength="167772160" />
  </requestFiltering>
</security>
<rewrite>
  <rules>
    <rule name="Photo Map reverse proxy" stopProcessing="true">
      <match url="^pm(?:/.*)?$" />
      <action
        type="Rewrite"
        url="http://<local_ip>:3000/{R:0}"
        appendQueryString="true"
      />
    </rule>
  </rules>
</rewrite>
```

ARR must preserve the original host header. The backend must receive the public host and HTTPS forwarding information; otherwise Next.js rejects authentication Server Actions when the forwarded host is the internal address.

Only the IIS server should be allowed to connect to TCP port 3000 on the Ubuntu VM. Internet clients should reach the application only through IIS on HTTPS port 443.

## Verification

Run these commands in an Ubuntu terminal:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

All four commands must exit successfully. For manual release verification:

1. Open the public URL from an iPhone using a mobile network.
2. Sign in with an organization account and a general Gmail account.
3. Upload geotagged and non-geotagged photos.
4. Confirm that nearby photos form count-labelled clusters and that clusters separate while zooming in.
5. Open a single marker and verify its protected thumbnail, date, and coordinates.
6. Sign out and confirm that protected pages and thumbnail URLs are no longer accessible.
7. Sign in as another user and confirm that the first user's photos are not visible.
8. Tap Install App and add RAIL PM to the iPhone Home Screen using the displayed instructions.

## Security Boundaries

- Every photo metadata query is filtered by the authenticated user's ID.
- Every thumbnail request checks both authentication and photo ownership.
- Original photos are never served from a public route.
- Client filenames are display-only and never participate in storage paths.
- Upload size, count, type, magic bytes, and image decoding are validated on the server.
- New upload folders use `MD5(userId)` and filenames use `MD5(original file bytes)`; these hashes are storage and duplicate identifiers, not authorization controls.
- Duplicate lookup always includes the authenticated user ID and never reveals whether another user uploaded the same bytes.
- Responses do not expose stored filenames or internal paths.
- OAuth tokens, secrets, databases, uploads, and thumbnails are excluded from Git.

## Current Limitations

- Storage and SQLite are local to one persistent server.
- There is no public sharing, photo deletion, offline photo data, or background upload.
- Batch total-size limits and rate limiting should be added before serving untrusted high-volume traffic.
- MD5 was selected for deterministic duplicate detection and filenames by product decision; it must not be reused for passwords, signatures, authorization, or integrity guarantees.
- Playwright automation, a web manifest, and an Apple touch icon are not yet included; iPhone validation is currently manual.

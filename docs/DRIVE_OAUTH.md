# Drive OAuth and env

This app supports two Drive integration modes:

- Service Account (server uploads/downloads) — controlled by `GOOGLE_SERVICE_ACCOUNT_JSON` and `GOOGLE_DRIVE_FOLDER_ID`.
- Per-user OAuth (recommended for multi-user) — users sign in with Google and the app stores their tokens to perform Drive operations on their behalf.

Env variables to set for per-user OAuth

- `GOOGLE_CLIENT_ID` - OAuth Client ID from Google Cloud Console (set in server env).
- `GOOGLE_CLIENT_SECRET` - OAuth Client Secret from Google Cloud Console (set in server env).
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - (optional) expose client id for client-side picker flows.

Notes

- Add your app origin (e.g. `http://localhost:3000`) as an authorized JavaScript origin and add redirect URIs in the OAuth client configuration.
- The app requests Drive scopes during sign-in: `https://www.googleapis.com/auth/drive.file` and `https://www.googleapis.com/auth/drive.readonly`.
- After sign-in, the app persists Google access and refresh tokens to the local file-based user store (`data/users.json`), which is fine for demos but not for production. Use a secure database and encrypt tokens in production.

Routes

- `POST /api/drive/user-upload` - requires an authenticated session (NextAuth cookie/token). Body: `{ filename, content }`.
- `GET /api/drive/user-download?fileId=...` - requires authenticated session.

Security

- Keep client secrets out of source control. Use environment variables or a secrets manager.
- Consider rotating refresh tokens and handling revocation.

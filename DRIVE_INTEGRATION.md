Google Drive Integration

This project includes optional server-side endpoints to upload and download JSON backups to Google Drive using a Google Service Account.

Environment variables

- `GOOGLE_SERVICE_ACCOUNT_JSON` - Required for server upload/download. Paste the full service account JSON here (stringified). Example:

  {
    "type": "service_account",
    "project_id": "...",
    "private_key_id": "...",
    "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
    "client_email": "...@...iam.gserviceaccount.com",
    "client_id": "...",
    ...
  }

- `GOOGLE_DRIVE_FOLDER_ID` - Optional. If set, uploaded files will be placed into this folder.

Notes

- The service account must be granted access to the Google Drive folder you intend to use. For personal drives, you can share the folder with the service account's `client_email` address.
- For production or multi-user setups you should use OAuth2 per-user flow instead of a service account.
- Endpoints:
  - `POST /api/drive/upload` - body: `{ filename, content }` returns created `file` metadata.
  - `GET /api/drive/download?fileId=...` - returns raw JSON file contents.

Client-side OAuth & Picker

- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - to enable the client-side Google Drive picker and OAuth, add a Google OAuth Client ID in the Google Cloud Console and set it in your environment as `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
- The app uses a popup OAuth flow to get an access token, lists the user's Drive files, and allows a quick selection. This flow requires adding the app origin (e.g. `http://localhost:3000`) as an authorized redirect URI in your OAuth client configuration.
- To pick a file from Drive in the app: open the Import modal -> click `Pick from Drive` -> sign in and grant permission -> select a file (via a numbered prompt) -> file content will be loaded into the import textarea.

Notes

- This is a simple convenience picker implementation to avoid adding the deprecated Google Picker SDK. It uses an OAuth popup (implicit flow with `response_type=token`) which is suitable for quick demos but for production you should implement PKCE / secure OAuth flows.
- For a more seamless UI we can replace the prompt with an in-app file list modal.

Security

- Keep the service account JSON secret and don't check it into git.
- Consider encrypting the JSON in environment variables or using a secret manager.

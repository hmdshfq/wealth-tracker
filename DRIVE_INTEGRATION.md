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

Security

- Keep the service account JSON secret and don't check it into git.
- Consider encrypting the JSON in environment variables or using a secret manager.

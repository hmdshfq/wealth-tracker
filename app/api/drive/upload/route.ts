import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Expect GOOGLE_SERVICE_ACCOUNT key as JSON in env, and DRIVE_FOLDER_ID optional
const SA_JSON = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '';
const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || undefined;

if (!SA_JSON) {
  console.warn('Google Drive upload route loaded but GOOGLE_SERVICE_ACCOUNT_JSON is not set');
}

export async function POST(req: NextRequest) {
  try {
    if (!SA_JSON) return NextResponse.json({ error: 'Server missing Google service account credentials' }, { status: 500 });

    const body = await req.json();
    const { filename, content } = body;
    if (!filename || !content) return NextResponse.json({ error: 'Missing filename or content' }, { status: 400 });

    const key = typeof SA_JSON === 'string' ? JSON.parse(SA_JSON) : SA_JSON;

    const jwtClient = new google.auth.JWT({
      email: key.client_email,
      key: key.private_key,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    await jwtClient.authorize();

    const drive = google.drive({ version: 'v3', auth: jwtClient });

    const fileMetadata: any = {
      name: filename,
    };
    if (DRIVE_FOLDER_ID) fileMetadata.parents = [DRIVE_FOLDER_ID];

    const media = {
      mimeType: 'application/json',
      body: Buffer.from(content),
    };

    const res = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, name, webViewLink, webContentLink',
    });

    return NextResponse.json({ file: res.data });
  } catch (err: any) {
    console.error('Drive upload failed', err.message || err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

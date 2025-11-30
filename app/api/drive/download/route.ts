import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const SA_JSON = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '';

export async function GET(req: NextRequest) {
  try {
    if (!SA_JSON) return NextResponse.json({ error: 'Server missing Google service account credentials' }, { status: 500 });

    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('fileId');
    if (!fileId) return NextResponse.json({ error: 'Missing fileId' }, { status: 400 });

    const key = typeof SA_JSON === 'string' ? JSON.parse(SA_JSON) : SA_JSON;

    const jwtClient = new google.auth.JWT({
      email: key.client_email,
      key: key.private_key,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    await jwtClient.authorize();

    const drive = google.drive({ version: 'v3', auth: jwtClient });

    // Request media as a stream and collect into a Buffer
    const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' as any });
    const stream = res.data as NodeJS.ReadableStream;

    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      stream.on?.('data', (chunk: Buffer) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      stream.on?.('end', () => resolve());
      stream.on?.('error', (err: unknown) => reject(err));
    });

    const buffer = Buffer.concat(chunks);

    return new NextResponse(buffer, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Drive download failed', err.message || err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

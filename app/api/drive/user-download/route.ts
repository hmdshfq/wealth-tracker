import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { auth } from '@/auth';
import { getUserById } from '@/app/lib/users';

export async function GET(req: NextRequest) {
  try {
    // Get session using NextAuth's auth() - no need to pass request
    // The session is automatically extracted from cookies
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserById(session.user.id as string);
    if (!user || !user.google || !user.google.accessToken) {
      return NextResponse.json({ error: 'No Google tokens available for user' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('fileId');
    if (!fileId) return NextResponse.json({ error: 'Missing fileId' }, { status: 400 });

    const oAuth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    oAuth2Client.setCredentials({
      access_token: user.google.accessToken,
      refresh_token: user.google.refreshToken,
      expiry_date: user.google.expiresAt,
    });

    const drive = google.drive({ version: 'v3', auth: oAuth2Client });

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
    console.error('User Drive download failed', err.message || err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { auth } from '@/auth';
import { getUserById } from '@/app/lib/users';
import { headers } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    console.log('Download request started');
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    console.log('Session retrieved:', !!session?.user?.id);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserById(session.user.id as string);
    console.log('User retrieved:', !!user?.google?.accessToken);
    
    if (!user || !user.google || !user.google.accessToken) {
      return NextResponse.json({ error: 'No Google tokens available for user' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('fileId');
    console.log('File ID:', fileId);
    
    if (!fileId) return NextResponse.json({ error: 'Missing fileId' }, { status: 400 });

    const oAuth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    oAuth2Client.setCredentials({
      access_token: user.google.accessToken,
      refresh_token: user.google.refreshToken,
      expiry_date: user.google.expiresAt,
    });

    const drive = google.drive({ version: 'v3', auth: oAuth2Client });
    console.log('Calling drive.files.get');

    // Request media as a stream and collect into a Buffer
    const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' as any });
    const stream = res.data as NodeJS.ReadableStream;
    console.log('Stream received');

    const chunks: Buffer[] = [];
    
    await new Promise<void>((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => {
        console.log('Received chunk:', chunk.length);
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });
      stream.on('end', () => {
        console.log('Stream ended');
        resolve();
      });
      stream.on('error', (err: unknown) => {
        console.error('Stream error:', err);
        reject(err);
      });
    });

    const buffer = Buffer.concat(chunks);
    const text = buffer.toString('utf-8');
    console.log('Converted to text, length:', text.length);

    return new NextResponse(text, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err: any) {
    console.error('User Drive download failed:', err.message || err);
    console.error('Full error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

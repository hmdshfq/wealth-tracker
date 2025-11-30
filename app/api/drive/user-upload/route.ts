import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';
import { google } from 'googleapis';
import { auth } from '@/auth';
import { getUserById } from '@/app/lib/users';

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { filename, content } = body;
    if (!filename || !content) return NextResponse.json({ error: 'Missing filename or content' }, { status: 400 });

    const oAuth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    oAuth2Client.setCredentials({
      access_token: user.google.accessToken,
      refresh_token: user.google.refreshToken,
      expiry_date: user.google.expiresAt,
    });

    // auto-refresh if needed
    const drive = google.drive({ version: 'v3', auth: oAuth2Client });

    // Create a readable stream from the content
    const buffer = Buffer.from(content, 'utf-8');
    const stream = Readable.from(buffer);

    const media = {
      mimeType: 'application/json',
      body: stream,
    };

    const res = await drive.files.create({
      requestBody: { name: filename },
      media,
      fields: 'id, name, webViewLink, webContentLink',
    });

    return NextResponse.json({ file: res.data });
  } catch (err: any) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

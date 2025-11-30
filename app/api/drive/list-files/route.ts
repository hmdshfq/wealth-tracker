import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { auth } from '@/auth';
import { getUserById } from '@/app/lib/users';

export async function GET() {
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

    const oAuth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    oAuth2Client.setCredentials({
      access_token: user.google.accessToken,
      refresh_token: user.google.refreshToken,
      expiry_date: user.google.expiresAt,
    });

    const drive = google.drive({ version: 'v3', auth: oAuth2Client });

    // Find wealthtracker folder
    const folderQuery = "name='wealthtracker' and mimeType='application/vnd.google-apps.folder' and trashed=false";
    const folderRes = await drive.files.list({
      q: folderQuery,
      spaces: 'drive',
      fields: 'files(id)',
      pageSize: 1,
    });

    if (!folderRes.data.files || folderRes.data.files.length === 0) {
      // Folder doesn't exist yet, return empty list
      return NextResponse.json({ files: [] });
    }

    const folderId = folderRes.data.files[0].id;

    // List files in the wealthtracker folder
    const filesRes = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false and mimeType='application/json'`,
      spaces: 'drive',
      fields: 'files(id, name, createdTime, modifiedTime)',
      pageSize: 50,
      orderBy: 'modifiedTime desc',
    });

    return NextResponse.json({ files: filesRes.data.files || [] });
  } catch {
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
  }
}

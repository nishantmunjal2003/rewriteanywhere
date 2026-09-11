import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getAdminSessionFromRequest } from '@/lib/admin-auth';
import { createRelease } from '@/lib/release-manager';

export const dynamic = 'force-dynamic';

function isAuthorized(request) {
  const session = getAdminSessionFromRequest(request);
  return Boolean(session);
}

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export async function POST(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin login required.' },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const version = formData.get('version')?.trim();
    const notes = formData.get('notes')?.trim() || '';
    const file = formData.get('file');

    if (!version) {
      return NextResponse.json(
        { success: false, message: 'Version name (e.g. v1.1.0) is required.' },
        { status: 400 }
      );
    }

    const downloadsDir = path.join(process.cwd(), 'public', 'downloads');
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }

    let fileName = 'AI-Rewrite-Anywhere-Setup.exe';
    let fileSize = '3.1 MB';
    let fileSizeBytes = 3114366;

    if (file && typeof file === 'object' && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      fileSizeBytes = buffer.length;
      fileSize = formatBytes(fileSizeBytes);

      // 1. Overwrite primary installer so standard download links always serve newest version
      const primaryFilePath = path.join(downloadsDir, 'AI-Rewrite-Anywhere-Setup.exe');
      fs.writeFileSync(primaryFilePath, buffer);

      // 2. Also keep a version-tagged archive copy
      const safeVersion = version.replace(/[^a-zA-Z0-9.-]/g, '_');
      const versionedFileName = `AI-Rewrite-Anywhere-Setup-${safeVersion}.exe`;
      const versionedFilePath = path.join(downloadsDir, versionedFileName);
      fs.writeFileSync(versionedFilePath, buffer);
      
      fileName = 'AI-Rewrite-Anywhere-Setup.exe';
    } else {
      // If no new file uploaded, check existing installer file size
      const existingFilePath = path.join(downloadsDir, 'AI-Rewrite-Anywhere-Setup.exe');
      if (fs.existsSync(existingFilePath)) {
        const stat = fs.statSync(existingFilePath);
        fileSizeBytes = stat.size;
        fileSize = formatBytes(fileSizeBytes);
      }
    }

    const downloadUrl = 'https://rewriteanywhere.nishantmunjal.com/downloads/AI-Rewrite-Anywhere-Setup.exe';

    const newRelease = createRelease({
      version,
      notes,
      fileName,
      fileSize,
      fileSizeBytes,
      downloadUrl
    });

    return NextResponse.json({
      success: true,
      message: `Release ${version} published successfully!`,
      release: newRelease
    });
  } catch (error) {
    console.error('Error uploading new release:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to upload and publish release.' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getActiveRelease } from '@/lib/release-manager';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const release = getActiveRelease();
    return NextResponse.json({
      success: true,
      version: release.version,
      releaseDate: release.releaseDate,
      fileName: release.fileName,
      fileSize: release.fileSize,
      downloadUrl: release.downloadUrl,
      notes: release.notes
    });
  } catch (error) {
    console.error('Error fetching active release:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch active release.' },
      { status: 500 }
    );
  }
}

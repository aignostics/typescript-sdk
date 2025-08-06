import { NextResponse } from 'next/server';
import { auth } from '../../../auth';
import { PlatformSDKHttp } from '@aignostics/sdk';

export async function GET() {
  try {
    // Get the session from the auth function
    const session = await auth();

    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized - No access token' }, { status: 401 });
    }

    // Initialize the SDK with the user's access token
    const sdk = new PlatformSDKHttp({
      baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://platform-dev.aignostics.com',
      tokenProvider: () => session.accessToken || null,
    });

    // Fetch application runs using the SDK
    const runs = await sdk.listApplicationRuns();

    return NextResponse.json({
      runs: runs || [],
      success: true,
    });
  } catch (error) {
    console.error('Error fetching application runs:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch application runs',
        success: false,
      },
      { status: 500 }
    );
  }
}

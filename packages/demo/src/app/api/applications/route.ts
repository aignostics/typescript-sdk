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
      baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://platform-dev.aignostics.ai',
      tokenProvider: () => session.accessToken || null,
    });

    // Fetch applications using the SDK
    const applications = await sdk.listApplications();

    return NextResponse.json({
      applications: applications || [],
      success: true,
    });
  } catch (error) {
    console.error('Error fetching applications:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch applications',
        success: false,
      },
      { status: 500 }
    );
  }
}

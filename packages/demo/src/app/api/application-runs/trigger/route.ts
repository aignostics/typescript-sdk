import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import { PlatformSDKHttp } from '@aignostics/sdk';

interface TriggerRunRequest {
  application_id: string;
  version: string;
  input_artifacts: Array<{
    name: string;
    download_url: string;
    mime_type: string;
    metadata: {
      width: number;
      height: number;
      base_mpp?: number;
      mime_type: string;
      checksum_crc32c: string;
    };
  }>;
}

export async function POST(request: NextRequest) {
  try {
    // Get the session from the auth function
    const session = await auth();

    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized - No access token' }, { status: 401 });
    }

    // Parse the request body
    const body = (await request.json()) as TriggerRunRequest;

    // Validate required fields
    if (!body.application_id || !body.version || !body.input_artifacts) {
      return NextResponse.json(
        { error: 'Missing required fields: application_id, version, or input_artifacts' },
        { status: 400 }
      );
    }

    // Initialize the SDK with the user's access token
    const sdk = new PlatformSDKHttp({
      baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://platform-dev.aignostics.com',
      tokenProvider: () => session.accessToken || null,
    });

    // Trigger the application run using the SDK
    // Convert input_artifacts to the items structure expected by the SDK
    const items = [
      {
        reference: 'user_input_slide',
        input_artifacts: body.input_artifacts.map(artifact => ({
          name: artifact.name,
          // In a real implementation, you would provide the download_url
          // For now, we'll use a placeholder as this is a demo
          download_url: artifact.download_url,
          metadata: artifact.metadata,
        })),
      },
    ];

    const result = await sdk.createApplicationRun({
      application_version_id: `${body.application_id}:v${body.version}`,
      items: items,
    });

    return NextResponse.json({
      application_run_id: result.application_run_id,
      success: true,
    });
  } catch (error) {
    console.error('Error triggering application run:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to trigger application run',
        success: false,
      },
      { status: 500 }
    );
  }
}

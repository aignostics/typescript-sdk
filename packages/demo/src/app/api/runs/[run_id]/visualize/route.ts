import PlatformSDKHttp from '@aignostics/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'packages/demo/src/auth';
import fs from 'fs/promises';
import { exec } from 'child_process';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ run_id: string }> }
) {
  const { run_id: runId } = await params;

  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized - No access token' }, { status: 401 });
  }

  // Initialize the SDK with the user's access token
  const sdk = new PlatformSDKHttp({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://platform-dev.aignostics.com',
    tokenProvider: () => session.accessToken || null,
  });

  const runOutput = await sdk.listRunResults(runId);
  const slideOutput = runOutput.find(item => item.reference === 'user_input_slide');
  if (!slideOutput) {
    return NextResponse.json(
      { error: 'Slide not found in run results', success: false },
      { status: 404 }
    );
  }

  const slideReadouts = slideOutput.output_artifacts.find(
    item => item.name === 'readout_generation:slide_readouts'
  );

  if (!slideReadouts) {
    return NextResponse.json(
      { error: 'Slide readouts not found in output artifacts', success: false },
      { status: 404 }
    );
  }

  if (!slideReadouts.download_url) {
    return NextResponse.json(
      { error: 'Slide readouts do not have a download URL', success: false },
      { status: 404 }
    );
  }

  const readoutsFileResponse = await fetch(slideReadouts.download_url);
  if (!readoutsFileResponse.ok) {
    return NextResponse.json(
      { error: 'Failed to fetch slide readouts file', success: false },
      { status: 500 }
    );
  }
  const dir = await fs.mkdtemp('/tmp/demo-app');
  const filePath = `${dir}/slide_readouts.csv`;

  await fs.writeFile(filePath, await readoutsFileResponse.text());

  const html = await new Promise<string>(resolve => {
    exec(
      `.venv/bin/marimo export html notebook.py -- --readouts-path ${filePath}`,
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing marimo: ${error.message}`);
        }
        if (stderr) {
          console.error(`Marimo stderr: ${stderr}`);
        }

        resolve(stdout);
      }
    );
  });

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}

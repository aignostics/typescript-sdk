'use client';

import { useSession } from 'next-auth/react';
import { PlatformSDKHttp } from '@aignostics/sdk';
import { useMemo } from 'react';
// Extend Session type locally to handle potential missing module augmentation

export function useSDK() {
  const { data: session } = useSession();

  const sdk = useMemo(() => {
    if (!session?.accessToken) {
      return null;
    }

    try {
      return new PlatformSDKHttp({
        baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://platform-dev.aignostics.com',
        tokenProvider: () => session.accessToken || null,
      });
    } catch (error) {
      console.error('Failed to initialize SDK:', error);
      return null;
    }
  }, [session?.accessToken]);

  return {
    sdk,
    isAuthenticated: !!session,
    session,
  };
}

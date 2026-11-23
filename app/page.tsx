'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Temporary redirect — `/` becomes the real landing page in PR 6 of the
 * redesign (docs/redesign/implementation-plan.md). Until then, the
 * dashboard that used to live here has moved to /tournaments; this is the
 * only thing standing in for a home route in between.
 */
export default function HomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/tournaments');
  }, [router]);

  return null;
}

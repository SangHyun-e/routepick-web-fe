'use client';

import { useEffect } from 'react';

const VIEW_TTL_SECONDS = 60 * 60; // 1시간

export default function PostViewCookiePing({ postId }: { postId: number }) {
  useEffect(() => {
    const key = `rp_view_${postId}`;

    const hasViewed = document.cookie.split('; ').some((c) => c.startsWith(`${key}=`));
    console.log('[view] ping', { postId, hasViewed, cookie: document.cookie });

    if (hasViewed) return;

    document.cookie = `${key}=1; Path=/; Max-Age=${VIEW_TTL_SECONDS}; SameSite=Lax`;
  }, [postId]);

  return null;
}

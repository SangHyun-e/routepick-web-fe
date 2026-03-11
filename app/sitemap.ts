import type { MetadataRoute } from 'next';

const SITE_URL = 'https://routepick.site';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: SITE_URL, lastModified },
    { url: `${SITE_URL}/posts`, lastModified },
    { url: `${SITE_URL}/write`, lastModified },
    { url: `${SITE_URL}/login`, lastModified },
  ];
}

export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cyberguard.uz';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/auth/kirish', '/auth/royxat'],
        disallow: ['/dashboard/', '/api/', '/admin/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

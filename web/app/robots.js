export default function robots() {
  const baseUrl = 'https://rewriteanywhere.nishantmunjal.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/api', '/api/'],
      },
      {
        // Explicit permissions for major LLMs and AI Search bots
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'OAI-SearchBot',
          'PerplexityBot',
          'ClaudeBot',
          'Anthropic-AI',
          'Google-Extended',
          'Applebot-Extended',
          'cohere-ai',
          'Bytespider',
          'CCBot',
          'Diffbot',
          'FacebookBot',
        ],
        allow: [
          '/',
          '/how-to-use',
          '/support',
          '/privacy',
          '/terms',
          '/llms.txt',
          '/llms-full.txt',
        ],
        disallow: ['/admin', '/admin/', '/api', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}

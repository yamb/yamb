export function postData(bytes = 1024, index = 0) {
  const paragraph = `# Yamb baseline

A post with **Markdown**, a [link](/blog) and \`code\`.

`;
  return {
    title: `Baseline ${index}`,
    slug: `baseline-${index}`,
    status: 'published',
    text: paragraph.repeat(Math.ceil(bytes / paragraph.length)).slice(0, bytes),
    tags: ['javascript'],
    meta: { title: 'Baseline', keywords: ['node'] },
    links: { related: [] },
    options: {},
    createdAt: '2026-11-01T12:00:00.000000000Z',
    updatedAt: '2026-11-01T12:00:00.000000000Z',
    publishedAt: '2026-11-01T12:00:00.000000000Z'
  };
}

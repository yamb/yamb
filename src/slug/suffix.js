const encoder = new TextEncoder();

export async function slugSuffix({ title, createdAt }) {
  const input = `${title}\n${createdAt.toString()}`;
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(input));

  return new Uint8Array(digest).toHex().slice(0, 6);
}

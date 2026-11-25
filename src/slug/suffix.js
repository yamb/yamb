import { hash } from 'node:crypto';

export function slugSuffix({ title, createdAt }) {
  return hash('sha256', `${title}\n${createdAt}`).slice(0, 6);
}

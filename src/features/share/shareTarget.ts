export type SharedPlaceCandidate = { id: string; title: string; text: string; url: string; createdAt: string };

const storageKey = 'spotory-shared-place-candidates';

export function listSharedCandidates(): SharedPlaceCandidate[] {
  try { return JSON.parse(localStorage.getItem(storageKey) || '[]') as SharedPlaceCandidate[]; }
  catch { return []; }
}

export function saveSharedCandidates(values: SharedPlaceCandidate[]) {
  localStorage.setItem(storageKey, JSON.stringify(values.slice(-100)));
  window.dispatchEvent(new Event('spotory-shared-candidates'));
}

export function addSharedCandidate(value: Pick<SharedPlaceCandidate, 'title' | 'text' | 'url'>) {
  const candidate = { ...value, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  saveSharedCandidates([...listSharedCandidates(), candidate]);
  return candidate;
}

export function removeSharedCandidates(ids: string[]) {
  const targets = new Set(ids); saveSharedCandidates(listSharedCandidates().filter(value => !targets.has(value.id)));
}

export function consumeWebShareTarget() {
  const params = new URLSearchParams(location.search);
  if (params.get('share-target') !== '1') return;
  const title = params.get('title')?.trim() || ''; const text = params.get('text')?.trim() || ''; const url = params.get('url')?.trim() || '';
  if (title || text || url) addSharedCandidate({ title, text, url });
  history.replaceState(null, '', `${location.pathname}#/settings`);
}

export function candidateQuery(candidate: Pick<SharedPlaceCandidate, 'title' | 'text' | 'url'>) {
  const title = candidate.title.trim();
  if (title && !/^google maps?$/i.test(title)) return title;
  const combined = `${candidate.text}\n${candidate.url}`;
  const fullUrlName = combined.match(/\/maps\/place\/([^/?#]+)/i)?.[1];
  if (fullUrlName) return decodeURIComponent(fullUrlName.replace(/\+/g, ' '));
  return combined.split(/\r?\n/).map(line => line.trim()).find(line => line && !/^https?:\/\//i.test(line) && !/^google maps?$/i.test(line)) || '';
}

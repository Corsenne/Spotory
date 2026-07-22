export type TakeoutPlace = {
  key: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  google_maps_url: string | null;
};

const clean = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const keyOf = (place: Omit<TakeoutPlace, 'key'>) => `${place.name}\u0000${place.address}\u0000${place.latitude ?? ''}\u0000${place.longitude ?? ''}`;

function parseCsvRows(text: string) {
  const rows: string[][] = []; let row: string[] = []; let cell = ''; let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"' && quoted && text[index + 1] === '"') { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell); if (row.some(value => value.trim())) rows.push(row); row = []; cell = '';
    } else cell += char;
  }
  row.push(cell); if (row.some(value => value.trim())) rows.push(row);
  return rows;
}

export function parseTakeoutCsv(text: string): TakeoutPlace[] {
  const rows = parseCsvRows(text.replace(/^\uFEFF/, ''));
  if (rows.length < 2) return [];
  const headers = rows[0].map(value => value.trim());
  const column = (...names: string[]) => headers.findIndex(header => names.includes(header));
  const nameIndex = column('場所', '名前', 'Name');
  const addressIndex = column('住所', 'Address');
  const urlIndex = column('URL', 'Google Maps URL');
  return rows.slice(1).flatMap(row => {
    const name = clean(row[nameIndex]); if (!name) return [];
    const place = { name, address: clean(row[addressIndex]), latitude: null, longitude: null, google_maps_url: clean(row[urlIndex]) || null };
    return [{ ...place, key: keyOf(place) }];
  });
}

export function parseTakeoutJson(text: string): TakeoutPlace[] {
  const parsed = JSON.parse(text) as { features?: unknown[] };
  if (!Array.isArray(parsed.features)) throw new Error('Google Takeoutの場所JSONとして認識できません。');
  return parsed.features.flatMap(feature => {
    if (!feature || typeof feature !== 'object') return [];
    const item = feature as { geometry?: { coordinates?: unknown[] }; properties?: Record<string, unknown> };
    const name = clean(item.properties?.name); if (!name) return [];
    const coordinates = item.geometry?.coordinates;
    const longitude = Array.isArray(coordinates) && typeof coordinates[0] === 'number' ? coordinates[0] : null;
    const latitude = Array.isArray(coordinates) && typeof coordinates[1] === 'number' ? coordinates[1] : null;
    const place = { name, address: clean(item.properties?.address), latitude, longitude, google_maps_url: clean(item.properties?.google_maps_url ?? item.properties?.url) || null };
    return [{ ...place, key: keyOf(place) }];
  });
}

export async function parseTakeoutFiles(files: File[]) {
  const places: TakeoutPlace[] = [];
  for (const file of files) {
    const text = await file.text();
    places.push(...(file.name.toLowerCase().endsWith('.json') ? parseTakeoutJson(text) : parseTakeoutCsv(text)));
  }
  return [...new Map(places.map(place => [place.key, place])).values()].slice(0, 1000);
}

import { describe, expect, it } from 'vitest';
import { parseTakeoutCsv, parseTakeoutJson } from './takeoutParser';

describe('Google Takeout parser', () => {
  it('GeoJSONから座標と場所を読む', () => {
    const result = parseTakeoutJson(JSON.stringify({ features: [{ geometry: { coordinates: [139.7, 35.6] }, properties: { name: '店', address: '東京都' } }] }));
    expect(result[0]).toMatchObject({ name: '店', address: '東京都', latitude: 35.6, longitude: 139.7 });
  });
  it('引用符を含むCSVを読む', () => {
    const result = parseTakeoutCsv('場所,住所,URL\r\n"店, 本店",東京都,https://maps.google.com/\r\n');
    expect(result[0]).toMatchObject({ name: '店, 本店', address: '東京都' });
  });
});

import { describe, expect, it } from 'vitest';
import { readZipTextFiles } from './zipReader';

function storedZip(name: string, text: string) {
  const encoder = new TextEncoder(); const fileName = encoder.encode(name); const data = encoder.encode(text);
  const localSize = 30 + fileName.length + data.length; const centralSize = 46 + fileName.length;
  const bytes = new Uint8Array(localSize + centralSize + 22); const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x04034b50, true); view.setUint16(8, 0, true); view.setUint32(18, data.length, true); view.setUint32(22, data.length, true); view.setUint16(26, fileName.length, true);
  bytes.set(fileName, 30); bytes.set(data, 30 + fileName.length);
  view.setUint32(localSize, 0x02014b50, true); view.setUint16(localSize + 10, 0, true); view.setUint32(localSize + 20, data.length, true); view.setUint32(localSize + 24, data.length, true); view.setUint16(localSize + 28, fileName.length, true); view.setUint32(localSize + 42, 0, true);
  bytes.set(fileName, localSize + 46);
  const eocd = localSize + centralSize; view.setUint32(eocd, 0x06054b50, true); view.setUint16(eocd + 8, 1, true); view.setUint16(eocd + 10, 1, true); view.setUint32(eocd + 12, centralSize, true); view.setUint32(eocd + 16, localSize, true);
  return bytes.buffer;
}

describe('Takeout ZIP reader', () => {
  it('ZIP内のCSVを解凍せず読み取る', async () => {
    const files = await readZipTextFiles(storedZip('Takeout/保存済み/お気に入り.csv', '場所,住所,URL\n店,東京,https://maps.google.com/'));
    expect(files).toEqual([{ name: 'Takeout/保存済み/お気に入り.csv', text: '場所,住所,URL\n店,東京,https://maps.google.com/' }]);
  });
});

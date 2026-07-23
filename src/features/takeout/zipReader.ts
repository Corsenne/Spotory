export type ArchiveTextFile = { name: string; text: string };

async function inflateRaw(data: Uint8Array) {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function readZipTextFiles(buffer: ArrayBuffer): Promise<ArchiveTextFile[]> {
  const view = new DataView(buffer); const bytes = new Uint8Array(buffer); const decoder = new TextDecoder();
  let eocd = -1;
  for (let offset = Math.max(0, bytes.length - 65_557); offset <= bytes.length - 22; offset += 1) if (view.getUint32(offset, true) === 0x06054b50) eocd = offset;
  if (eocd < 0) throw new Error('GoogleのZIPファイルを解析できませんでした。');
  const entries = view.getUint16(eocd + 10, true); let offset = view.getUint32(eocd + 16, true); const files: ArchiveTextFile[] = [];
  for (let index = 0; index < entries; index += 1) {
    if (view.getUint32(offset, true) !== 0x02014b50) throw new Error('ZIPのファイル一覧が壊れています。');
    const method = view.getUint16(offset + 10, true); const compressedSize = view.getUint32(offset + 20, true);
    const nameLength = view.getUint16(offset + 28, true); const extraLength = view.getUint16(offset + 30, true); const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true); const name = decoder.decode(bytes.slice(offset + 46, offset + 46 + nameLength));
    const localNameLength = view.getUint16(localOffset + 26, true); const localExtraLength = view.getUint16(localOffset + 28, true); const start = localOffset + 30 + localNameLength + localExtraLength;
    if (name.toLowerCase().endsWith('.csv')) {
      const compressed = bytes.slice(start, start + compressedSize); const content = method === 0 ? compressed : method === 8 ? await inflateRaw(compressed) : null;
      if (content) files.push({ name, text: decoder.decode(content) });
    }
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return files;
}

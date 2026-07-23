import { useState } from 'react';
import { CloudDownload } from 'lucide-react';
import { clearPortabilitySession, getPortabilityArchiveState, getPortabilityError, getPortabilitySession, initiatePortabilityArchive, startPortabilityAuthorization } from './portabilityAuth';
import { parseTakeoutCsv, type TakeoutPlace } from './takeoutParser';
import { readZipTextFiles } from './zipReader';

export type SavedCollection = { name: string; places: TakeoutPlace[] };

const collectionName = (path: string) => path.split('/').pop()?.replace(/\.csv$/i, '') || '保存済みリスト';

async function downloadCollections(urls: string[]) {
  const collections: SavedCollection[] = [];
  for (const url of urls) {
    const response = await fetch(url); if (!response.ok) throw new Error(`Googleアーカイブをダウンロードできませんでした（${response.status}）`);
    const buffer = await response.arrayBuffer(); const signature = new DataView(buffer).getUint32(0, true);
    const files = signature === 0x04034b50 ? await readZipTextFiles(buffer) : [{ name: 'Google保存リスト.csv', text: new TextDecoder().decode(buffer) }];
    for (const file of files) { const places = parseTakeoutCsv(file.text); if (places.length) collections.push({ name: collectionName(file.name), places }); }
  }
  return collections;
}

export function GoogleSavedListsImporter({ onLoad }: { onLoad: (collections: SavedCollection[]) => void }) {
  const configured = Boolean(import.meta.env.VITE_GOOGLE_PORTABILITY_CLIENT_ID?.trim());
  const [message, setMessage] = useState(() => getPortabilityError()); const [busy, setBusy] = useState(false);
  const session = getPortabilitySession();

  async function startOrCheck() {
    const current = getPortabilitySession(); if (!current) { startPortabilityAuthorization(); return; }
    if (current.expiresAt <= Date.now()) { clearPortabilitySession(); setMessage('Googleの許可が期限切れです。「Google保存リストに接続」からやり直してください。'); return; }
    setBusy(true);
    try {
      const jobId = current.jobId || await initiatePortabilityArchive(current.accessToken);
      const state = await getPortabilityArchiveState(current.accessToken, jobId);
      if (state.state === 'COMPLETE' && state.urls?.length) { setMessage('保存リストを読み込んでいます…'); const collections = await downloadCollections(state.urls); clearPortabilitySession(); onLoad(collections); setMessage(`${collections.length}個の保存リストを読み込みました。`); }
      else if (state.state === 'FAILED' || state.state === 'CANCELLED') setMessage(state.error?.message || 'Googleでの書き出しに失敗しました。');
      else setMessage('Googleが保存リストを書き出しています。数分後に「進行状況を確認」を押してください。');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Google保存リストを取得できませんでした。'); }
    finally { setBusy(false); }
  }

  if (!configured) return <p className="hint">Google保存リスト連携は未設定です。</p>;
  return <div className="portability-import"><button type="button" className="secondary" disabled={busy} onClick={() => void startOrCheck()}><CloudDownload/>{busy ? '確認中…' : session?.jobId ? '進行状況を確認' : session ? '保存リストの取得を開始' : 'Google保存リストに接続'}</button>{message && <p className="notice" role="status">{message}</p>}</div>;
}

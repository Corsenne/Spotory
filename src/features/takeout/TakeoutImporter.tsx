import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FileUp } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { SharedPlacesImporter } from '../share/SharedPlacesImporter';
import { repository } from '../../repositories/spotoryRepository';
import { GoogleSavedListsImporter, type SavedCollection } from './GoogleSavedListsImporter';
import { parseTakeoutCsv, parseTakeoutFiles, type TakeoutPlace } from './takeoutParser';
import { readZipTextFiles } from './zipReader';

const collectionName = (path: string) => path.split('/').pop()?.replace(/\.csv$/i, '') || '保存済みリスト';

export function TakeoutImporter() {
  const { user } = useAuth(); const queryClient = useQueryClient();
  const [places, setPlaces] = useState<TakeoutPlace[]>([]); const [selected, setSelected] = useState<Set<string>>(new Set());
  const [collections, setCollections] = useState<SavedCollection[]>([]); const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);

  function loadCollections(next: SavedCollection[]) { setCollections(next); setSelectedCollections(new Set(next.map(collection => collection.name))); setPlaces([]); setSelected(new Set()); }
  async function load(files: File[]) {
    setMessage(''); setCollections([]); setSelectedCollections(new Set());
    try {
      const zipFiles = files.filter(file => file.name.toLowerCase().endsWith('.zip'));
      if (zipFiles.length) {
        const next: SavedCollection[] = [];
        for (const zip of zipFiles) for (const file of await readZipTextFiles(await zip.arrayBuffer())) { const parsed = parseTakeoutCsv(file.text); if (parsed.length) next.push({ name: collectionName(file.name), places: parsed }); }
        loadCollections(next); setMessage(next.length ? `${next.length}個の保存リストをZIPから読み込みました。` : 'ZIP内にGoogleの保存リストCSVが見つかりませんでした。'); return;
      }
      const parsed = await parseTakeoutFiles(files); setPlaces(parsed); setSelected(new Set(parsed.map(place => place.key))); setMessage(parsed.length ? `${parsed.length}件を読み込みました。登録しない場所はチェックを外してください。` : '登録できる場所が見つかりませんでした。');
    } catch (error) { setPlaces([]); setSelected(new Set()); setMessage(error instanceof Error ? error.message : 'ファイルを読み込めませんでした。'); }
  }

  async function register(values: TakeoutPlace[]) {
    if (!user || !values.length) return; setBusy(true); setMessage('登録中…');
    try { const result = await repository.importPlaces(values, user.id); await queryClient.invalidateQueries({ queryKey: ['places'] }); setPlaces([]); setSelected(new Set()); setCollections([]); setSelectedCollections(new Set()); setMessage(`${result.created}件を登録しました。${result.skipped ? ` 重複${result.skipped}件はスキップしました。` : ''}`); }
    catch (error) { setMessage(error instanceof Error ? error.message : '一括登録に失敗しました。'); }
    finally { setBusy(false); }
  }

  const collectionPlaces = collections.filter(collection => selectedCollections.has(collection.name)).flatMap(collection => collection.places);
  return <><SharedPlacesImporter/><section className="takeout-importer"><details><summary>ファイルから一括登録（予備手段）</summary><p>Google Takeoutの「保存済み」ZIP、またはGoogle Mapsから書き出したCSV／JSONを読み込めます。</p><label className="takeout-file"><FileUp/> ZIP・CSV・JSONを選択<input type="file" accept=".zip,application/zip,.json,.csv,application/json,text/csv" multiple onChange={event => void load(Array.from(event.target.files || []))}/></label>{collections.length > 0 && <><div className="saved-collection-list">{collections.map(collection => <label key={collection.name}><input type="checkbox" checked={selectedCollections.has(collection.name)} onChange={event => setSelectedCollections(current => { const next = new Set(current); if (event.target.checked) next.add(collection.name); else next.delete(collection.name); return next; })}/><span><b>{collection.name}</b><small>{collection.places.length}件</small></span></label>)}</div><button type="button" className="primary" disabled={busy || !collectionPlaces.length} onClick={() => void register(collectionPlaces)}>{busy ? '登録中…' : `選択したリストの${collectionPlaces.length}件を登録`}</button></>}{places.length > 0 && <><div className="takeout-actions"><button type="button" onClick={() => setSelected(new Set(places.map(place => place.key)))}>すべて選択</button><button type="button" onClick={() => setSelected(new Set())}>選択解除</button></div><div className="takeout-list">{places.map(place => <label key={place.key}><input type="checkbox" checked={selected.has(place.key)} onChange={event => setSelected(current => { const next = new Set(current); if (event.target.checked) next.add(place.key); else next.delete(place.key); return next; })}/><span><b>{place.name}</b><small>{place.address || '住所なし'}</small></span></label>)}</div><button type="button" className="primary" disabled={busy || !selected.size} onClick={() => void register(places.filter(place => selected.has(place.key)))}>{busy ? '登録中…' : `選択した${selected.size}件を登録`}</button></>}</details><details className="manual-takeout"><summary>対応地域向けのGoogle直接連携</summary><p>Data Portability APIの対応地域に関連付けられたGoogleアカウントだけが利用できます。日本のアカウントでは利用できません。</p><GoogleSavedListsImporter onLoad={loadCollections}/></details>{message && <p className="notice" role="status">{message}</p>}</section></>;
}

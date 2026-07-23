import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FileUp } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { repository } from '../../repositories/spotoryRepository';
import { GoogleSavedListsImporter, type SavedCollection } from './GoogleSavedListsImporter';
import { parseTakeoutFiles, type TakeoutPlace } from './takeoutParser';

export function TakeoutImporter() {
  const { user } = useAuth(); const queryClient = useQueryClient();
  const [places, setPlaces] = useState<TakeoutPlace[]>([]); const [selected, setSelected] = useState<Set<string>>(new Set());
  const [collections, setCollections] = useState<SavedCollection[]>([]); const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);

  function loadCollections(next: SavedCollection[]) { setCollections(next); setSelectedCollections(new Set(next.map(collection => collection.name))); setPlaces([]); setSelected(new Set()); }
  async function load(files: File[]) {
    setMessage(''); setCollections([]); setSelectedCollections(new Set());
    try { const parsed = await parseTakeoutFiles(files); setPlaces(parsed); setSelected(new Set(parsed.map(place => place.key))); setMessage(parsed.length ? `${parsed.length}件を読み込みました。登録しない場所はチェックを外してください。` : '登録できる場所が見つかりませんでした。'); }
    catch (error) { setPlaces([]); setSelected(new Set()); setMessage(error instanceof Error ? error.message : 'ファイルを読み込めませんでした。'); }
  }

  async function register(values: TakeoutPlace[]) {
    if (!user || !values.length) return; setBusy(true); setMessage('登録中…');
    try { const result = await repository.importPlaces(values, user.id); await queryClient.invalidateQueries({ queryKey: ['places'] }); setPlaces([]); setSelected(new Set()); setCollections([]); setSelectedCollections(new Set()); setMessage(`${result.created}件を登録しました。${result.skipped ? ` 重複${result.skipped}件はスキップしました。` : ''}`); }
    catch (error) { setMessage(error instanceof Error ? error.message : '一括登録に失敗しました。'); }
    finally { setBusy(false); }
  }

  const collectionPlaces = collections.filter(collection => selectedCollections.has(collection.name)).flatMap(collection => collection.places);
  return <section className="takeout-importer"><h2>Googleマップから一括登録</h2><p>Googleアカウントの保存リストを選んで取り込めます。Googleでの書き出しには数分以上かかる場合があります。</p><GoogleSavedListsImporter onLoad={loadCollections}/>{collections.length > 0 && <><div className="saved-collection-list">{collections.map(collection => <label key={collection.name}><input type="checkbox" checked={selectedCollections.has(collection.name)} onChange={event => setSelectedCollections(current => { const next = new Set(current); if (event.target.checked) next.add(collection.name); else next.delete(collection.name); return next; })}/><span><b>{collection.name}</b><small>{collection.places.length}件</small></span></label>)}</div><button type="button" className="primary" disabled={busy || !collectionPlaces.length} onClick={() => void register(collectionPlaces)}>{busy ? '登録中…' : `選択したリストの${collectionPlaces.length}件を登録`}</button></>}<details className="manual-takeout"><summary>Takeoutファイルから取り込む</summary><p>「ラベル付きの場所.json」または場所リストCSVを選択します。ファイル自体は保存されません。</p><label className="takeout-file"><FileUp/> ファイルを選択<input type="file" accept=".json,.csv,application/json,text/csv" multiple onChange={event => void load(Array.from(event.target.files || []))}/></label></details>{message && <p className="notice" role="status">{message}</p>}{places.length > 0 && <><div className="takeout-actions"><button type="button" onClick={() => setSelected(new Set(places.map(place => place.key)))}>すべて選択</button><button type="button" onClick={() => setSelected(new Set())}>選択解除</button></div><div className="takeout-list">{places.map(place => <label key={place.key}><input type="checkbox" checked={selected.has(place.key)} onChange={event => setSelected(current => { const next = new Set(current); if (event.target.checked) next.add(place.key); else next.delete(place.key); return next; })}/><span><b>{place.name}</b><small>{place.address || '住所なし'}</small></span></label>)}</div><button type="button" className="primary" disabled={busy || !selected.size} onClick={() => void register(places.filter(place => selected.has(place.key)))}>{busy ? '登録中…' : `選択した${selected.size}件を登録`}</button></>}</section>;
}

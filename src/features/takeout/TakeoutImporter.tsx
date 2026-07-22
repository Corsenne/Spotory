import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FileUp } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { repository } from '../../repositories/spotoryRepository';
import { parseTakeoutFiles, type TakeoutPlace } from './takeoutParser';

export function TakeoutImporter() {
  const { user } = useAuth(); const queryClient = useQueryClient();
  const [places, setPlaces] = useState<TakeoutPlace[]>([]); const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);

  async function load(files: File[]) {
    setMessage('');
    try { const parsed = await parseTakeoutFiles(files); setPlaces(parsed); setSelected(new Set(parsed.map(place => place.key))); setMessage(parsed.length ? `${parsed.length}件を読み込みました。登録しない場所はチェックを外してください。` : '登録できる場所が見つかりませんでした。'); }
    catch (error) { setPlaces([]); setSelected(new Set()); setMessage(error instanceof Error ? error.message : 'ファイルを読み込めませんでした。'); }
  }

  async function register() {
    if (!user || !selected.size) return;
    setBusy(true); setMessage('登録中…');
    try {
      const result = await repository.importPlaces(places.filter(place => selected.has(place.key)), user.id);
      await queryClient.invalidateQueries({ queryKey: ['places'] });
      setPlaces([]); setSelected(new Set()); setMessage(`${result.created}件を登録しました。${result.skipped ? ` 重複${result.skipped}件はスキップしました。` : ''}`);
    } catch (error) { setMessage(error instanceof Error ? error.message : '一括登録に失敗しました。'); }
    finally { setBusy(false); }
  }

  return <section className="takeout-importer"><h2>Googleマップから一括登録</h2><p>Google Takeoutの「ラベル付きの場所.json」または場所リストCSVを選択します。ファイル自体は保存されません。</p><label className="takeout-file"><FileUp/> ファイルを選択<input type="file" accept=".json,.csv,application/json,text/csv" multiple onChange={event => void load(Array.from(event.target.files || []))}/></label>{message && <p className="notice" role="status">{message}</p>}{places.length > 0 && <><div className="takeout-actions"><button type="button" onClick={() => setSelected(new Set(places.map(place => place.key)))}>すべて選択</button><button type="button" onClick={() => setSelected(new Set())}>選択解除</button></div><div className="takeout-list">{places.map(place => <label key={place.key}><input type="checkbox" checked={selected.has(place.key)} onChange={event => setSelected(current => { const next = new Set(current); if (event.target.checked) next.add(place.key); else next.delete(place.key); return next; })}/><span><b>{place.name}</b><small>{place.address || '住所なし'}</small></span></label>)}</div><button type="button" className="primary" disabled={busy || !selected.size} onClick={() => void register()}>{busy ? '登録中…' : `選択した${selected.size}件を登録`}</button></>}</section>;
}

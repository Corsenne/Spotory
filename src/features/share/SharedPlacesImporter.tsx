import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Link2, MapPin, Trash2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { repository } from '../../repositories/spotoryRepository';
import type { TakeoutPlace } from '../takeout/takeoutParser';
import { addSharedCandidate, candidateQuery, listSharedCandidates, removeSharedCandidates, type SharedPlaceCandidate } from './shareTarget';

type Resolved = TakeoutPlace & { sourceId: string };
const placeKey = (name: string, address: string, latitude: number | null, longitude: number | null) => `${name}\u0000${address}\u0000${latitude ?? ''}\u0000${longitude ?? ''}`;

function SharedPlacesControl() {
  const placesLibrary = useMapsLibrary('places'); const { user } = useAuth(); const queryClient = useQueryClient();
  const [items, setItems] = useState(() => listSharedCandidates()); const [resolved, setResolved] = useState<Record<string, Resolved>>({});
  const [manual, setManual] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { const refresh = () => setItems(listSharedCandidates()); window.addEventListener('spotory-shared-candidates', refresh); return () => window.removeEventListener('spotory-shared-candidates', refresh); }, []);

  async function resolve(item: SharedPlaceCandidate) {
    if (!placesLibrary) throw new Error('Google Placesを読み込み中です。少し待ってからお試しください。');
    const query = candidateQuery(item); if (!query) throw new Error('店名を取得できません。共有内容を貼り付けて追加してください。');
    const response = await placesLibrary.Place.searchByText({ textQuery: query, fields: ['id', 'displayName', 'formattedAddress', 'location', 'googleMapsURI', 'primaryTypeDisplayName'], language: 'ja', region: 'JP', maxResultCount: 1 });
    const place = response.places[0]; if (!place) throw new Error(`「${query}」に一致する店舗が見つかりませんでした。`);
    const name = place.displayName || query; const address = place.formattedAddress || ''; const latitude = place.location?.lat() ?? null; const longitude = place.location?.lng() ?? null;
    setResolved(current => ({ ...current, [item.id]: { sourceId: item.id, key: placeKey(name, address, latitude, longitude), name, address, latitude, longitude, google_maps_url: place.googleMapsURI || item.url || null } }));
  }

  async function resolveAll() {
    setBusy(true); setMessage('');
    try { for (const item of items) if (!resolved[item.id]) await resolve(item); setMessage('店舗情報を確認しました。内容を確認して登録してください。'); }
    catch (error) { setMessage(error instanceof Error ? error.message : '店舗を確認できませんでした。'); }
    finally { setBusy(false); }
  }

  async function register() {
    if (!user) return; const values = Object.values(resolved); if (!values.length) return;
    setBusy(true); setMessage('登録中…');
    try { const result = await repository.importPlaces(values, user.id); removeSharedCandidates(values.map(value => value.sourceId)); setResolved({}); await queryClient.invalidateQueries({ queryKey: ['places'] }); setMessage(`${result.created}件を登録しました。${result.skipped ? ` 重複${result.skipped}件はスキップしました。` : ''}`); }
    catch (error) { setMessage(error instanceof Error ? error.message : '共有店舗を登録できませんでした。'); }
    finally { setBusy(false); }
  }

  function addManual() {
    const value = manual.trim(); if (!value) return; const url = value.match(/https?:\/\/\S+/)?.[0] || ''; const title = value.split(/\r?\n/).find(line => line.trim() && !/^https?:\/\//.test(line.trim())) || '';
    addSharedCandidate({ title, text: value, url }); setManual(''); setMessage('追加候補へ入れました。');
  }

  return <section className="shared-importer"><h2>Google Mapsから共有</h2><p>Google Mapsで店舗の共有先にSpotoryを選ぶと、ここへ追加候補として貯まります。</p><div className="share-paste"><textarea rows={2} value={manual} onChange={event => setManual(event.target.value)} placeholder="共有内容やGoogle Maps URLを貼り付け"/><button type="button" className="secondary" onClick={addManual}><Link2/>候補へ追加</button></div>{items.length > 0 ? <><div className="shared-candidate-list">{items.map(item => <article key={item.id}><MapPin/><div><b>{resolved[item.id]?.name || candidateQuery(item) || '名称未取得'}</b><small>{resolved[item.id]?.address || item.url || item.text}</small></div><button type="button" aria-label="候補を削除" onClick={() => removeSharedCandidates([item.id])}><Trash2/></button></article>)}</div><button type="button" className="secondary full" disabled={busy || !placesLibrary} onClick={() => void resolveAll()}>{busy ? '確認中…' : '店舗情報をまとめて確認'}</button><button type="button" className="primary full" disabled={busy || !Object.keys(resolved).length} onClick={() => void register()}>確認済みの{Object.keys(resolved).length}件を登録</button></> : <p className="hint">共有された店舗はまだありません。Spotoryが共有先に出ない端末では、Google Mapsの共有内容を上へ貼り付けてください。</p>}{message && <p className="notice" role="status">{message}</p>}</section>;
}

export function SharedPlacesImporter() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey) return <p className="hint">Google Maps APIキーが未設定です。</p>;
  return <APIProvider apiKey={apiKey} language="ja" region="JP"><SharedPlacesControl/></APIProvider>;
}

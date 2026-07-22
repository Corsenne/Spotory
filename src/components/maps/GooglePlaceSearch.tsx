import { useEffect, useRef, useState } from 'react';
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps';
import { LocateFixed, Search } from 'lucide-react';
import type { Place } from '../../types';
import { googleMapsUrl } from '../../utils';

type SelectedPlace = Pick<Place, 'name' | 'address' | 'latitude' | 'longitude' | 'google_place_id' | 'google_maps_url' | 'category'>;

function SearchControl({ onSelect }: { onSelect: (place: SelectedPlace) => void }) {
  const placesLibrary = useMapsLibrary('places');
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<google.maps.places.PlacePrediction[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState('');
  const tokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!placesLibrary || query.trim().length < 2) { setSuggestions([]); setLoading(false); return; }
    const requestId = ++requestIdRef.current;
    const timer = window.setTimeout(async () => {
      if (!tokenRef.current) tokenRef.current = new placesLibrary.AutocompleteSessionToken();
      setLoading(true); setError('');
      try {
        const response = await placesLibrary.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: query.trim(), language: 'ja', region: 'jp', sessionToken: tokenRef.current,
          locationBias: currentLocation ? { center: currentLocation, radius: 20_000 } : undefined,
          origin: currentLocation || undefined,
        });
        if (requestId === requestIdRef.current) setSuggestions(response.suggestions.flatMap(item => item.placePrediction ? [item.placePrediction] : []));
      } catch (caught) {
        if (requestId === requestIdRef.current) {
          const detail = caught instanceof Error ? caught.message : 'Google Maps APIから応答がありません';
          setError(`Googleの店舗検索を利用できません：${detail}`);
        }
      }
      finally { if (requestId === requestIdRef.current) setLoading(false); }
    }, 450);
    return () => window.clearTimeout(timer);
  }, [currentLocation, placesLibrary, query]);

  function useCurrentLocation() {
    if (!navigator.geolocation) { setLocationStatus('この端末では位置情報を利用できません。'); return; }
    setLocationStatus('現在地を取得中…');
    navigator.geolocation.getCurrentPosition(
      position => {
        setCurrentLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationStatus('現在地周辺を優先しています。');
      },
      () => setLocationStatus('位置情報を取得できませんでした。通常の検索を利用します。'),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }

  async function choose(prediction: google.maps.places.PlacePrediction) {
    if (!placesLibrary) return;
    setLoading(true); setError('');
    try {
      const place = prediction.toPlace();
      await place.fetchFields({ fields: ['id', 'displayName', 'formattedAddress', 'location', 'googleMapsURI', 'primaryTypeDisplayName'] });
      const selected: SelectedPlace = { name: place.displayName || prediction.text.toString(), address: place.formattedAddress || '', latitude: place.location?.lat() ?? null, longitude: place.location?.lng() ?? null, google_place_id: place.id, google_maps_url: place.googleMapsURI || null, category: place.primaryTypeDisplayName || null };
      if (!selected.google_maps_url) selected.google_maps_url = googleMapsUrl(selected);
      onSelect(selected); setQuery(selected.name); setSuggestions([]); tokenRef.current = new placesLibrary.AutocompleteSessionToken();
    } catch { setError('店舗情報を取得できませんでした。もう一度選択してください。'); }
    finally { setLoading(false); }
  }

  return <div className="place-search"><label><Search aria-hidden/> Googleマップから店舗を検索<input value={query} onChange={event => setQuery(event.target.value)} placeholder="店舗名や住所を入力" autoComplete="off"/></label><button type="button" className={currentLocation ? 'location-bias active' : 'location-bias'} onClick={useCurrentLocation}><LocateFixed aria-hidden/>{currentLocation ? '現在地周辺を優先中' : '現在地周辺を優先'}</button>{locationStatus && <small role="status">{locationStatus}</small>}{loading && <small role="status">検索中…</small>}{error && <p className="error" role="alert">{error}</p>}{suggestions.length > 0 && <ul aria-label="Googleマップの検索候補">{suggestions.map(prediction => <li key={prediction.placeId}><button type="button" onClick={() => void choose(prediction)}>{prediction.text.toString()}</button></li>)}</ul>}<small>候補を選ぶと、店舗名・住所・座標・Google Maps URLが自動入力されます。</small></div>;
}

export function GooglePlaceSearch({ onSelect }: { onSelect: (place: SelectedPlace) => void }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey) return <p className="hint">Google Maps APIキーが未設定のため、下の欄へ手入力してください。</p>;
  return <APIProvider apiKey={apiKey} language="ja" region="JP"><SearchControl onSelect={onSelect}/></APIProvider>;
}

import { APIProvider, AdvancedMarker, Map } from '@vis.gl/react-google-maps';

type Props = { latitude: number | null | undefined; longitude: number | null | undefined; name: string };

function LocationPreview({ latitude, longitude, name }: Props) {
  if (latitude == null || longitude == null) return null;
  const position = { lat: latitude, lng: longitude };
  return <section className="visit-location-preview" aria-label="選択した店舗の地図">
    <h2>店舗の位置</h2>
    <Map key={`${latitude}-${longitude}`} className="visit-location-map" defaultCenter={position} defaultZoom={16} mapId="DEMO_MAP_ID" gestureHandling="cooperative" disableDefaultUI zoomControl>
      <AdvancedMarker position={position} title={name || '選択した店舗'} />
    </Map>
    <p>{name || '選択した店舗'}</p>
  </section>;
}

export function VisitLocationMap(props: Props) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey || props.latitude == null || props.longitude == null) return null;
  return <APIProvider apiKey={apiKey} language="ja" region="JP"><LocationPreview {...props} /></APIProvider>;
}

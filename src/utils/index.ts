import type { GroupRole, Visibility, Visit, VisitFormValue } from '../types';
export const googleMapsUrl = (place: { google_place_id?: string|null; latitude?: number|null; longitude?: number|null; address?: string|null; name?: string|null }, directions = false) => {
  const base = `https://www.google.com/maps/${directions ? 'dir/?api=1&destination=' : 'search/?api=1&query='}`;
  const query = place.latitude != null && place.longitude != null ? `${place.latitude},${place.longitude}` : (place.address || place.name || '');
  const id = place.google_place_id && !directions ? `&query_place_id=${encodeURIComponent(place.google_place_id)}` : '';
  return `${base}${encodeURIComponent(query)}${id}`;
};
export const validateVisit = (value: VisitFormValue) => { const errors: string[] = []; if (!value.place.name.trim()) errors.push('場所名を入力してください'); if (!/^\d{4}-\d{2}-\d{2}$/.test(value.visited_at)) errors.push('訪問日を入力してください'); if (value.rating !== null && (value.rating < 1 || value.rating > 5)) errors.push('評価は1〜5で入力してください'); if (value.visibility === 'group' && !value.group_ids.length) errors.push('共有グループを選択してください'); return errors; };
export const canEdit = (ownerId: string, userId: string, role?: GroupRole) => ownerId === userId || role === 'owner' || role === 'editor';
export const visibilityLabel = (v: Visibility) => ({ private: '自分のみ', group: 'グループ', link: '共有リンク' }[v]);
const csvCell = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
export const visitsToCsv = (visits: Visit[]) => { const columns = ['place_name','address','visited_at','rating','comment','category','tags','latitude','longitude','google_maps_url','visibility']; const rows = visits.map(v => [v.place?.name,v.place?.address,v.visited_at,v.rating,v.comment,v.category ?? v.place?.category,v.tags?.join('|'),v.place?.latitude,v.place?.longitude,v.place?.google_maps_url,v.visibility]); return '\uFEFF' + [columns, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n'); };
export const downloadBlob = (name: string, content: string, type: string) => { const url = URL.createObjectURL(new Blob([content], { type })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 0); };
export const resizeDimensions = (width: number, height: number, max = 1600) => { const ratio = Math.min(1, max / Math.max(width, height)); return { width: Math.round(width * ratio), height: Math.round(height * ratio) }; };
export const today = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;

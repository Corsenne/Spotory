import type { Group, Place, Visit } from '../types';
const user = 'demo-user'; const now = new Date().toISOString();
export const mockPlaces: Place[] = [
  { id:'p1', name:'海辺のコーヒー', address:'神奈川県鎌倉市', latitude:35.319, longitude:139.547, category:'カフェ', created_by:user, created_at:now, google_maps_url:'https://maps.google.com' },
  { id:'p2', name:'路地裏ビストロ', address:'東京都渋谷区', latitude:35.658, longitude:139.701, category:'レストラン', created_by:user, created_at:now }
];
export const mockVisits: Visit[] = [
  { id:'v1', place_id:'p1', user_id:user, visited_at:'2026-07-18', rating:5, comment:'夕暮れと深煎りコーヒーが最高でした。', visibility:'private', is_favorite:true, is_wishlist:false, created_at:now, place:mockPlaces[0], tags:['海','コーヒー'] },
  { id:'v2', place_id:'p2', user_id:user, visited_at:'2026-07-10', rating:4, comment:'小さくて落ち着くお店。', visibility:'group', is_favorite:false, is_wishlist:false, created_at:now, place:mockPlaces[1], tags:['ディナー'] }
];
export const mockGroups: Group[] = [{ id:'g1', name:'週末グルメ部', owner_id:user, role:'owner', member_count:3, created_at:now }];

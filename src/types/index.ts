export type Visibility = 'private' | 'group' | 'link';
export type GroupRole = 'owner' | 'editor' | 'viewer';
export interface Profile { id: string; display_name: string; avatar_path?: string | null }
export interface Place { id: string; google_place_id?: string | null; name: string; address?: string | null; latitude?: number | null; longitude?: number | null; google_maps_url?: string | null; category?: string | null; created_by: string; created_at: string; updated_at?: string }
export interface Photo { id: string; visit_id: string; user_id: string; storage_path: string; signed_url?: string; sort_order: number; width?: number; height?: number; file_size?: number; mime_type?: string; created_at: string }
export interface Visit { id: string; place_id: string; user_id: string; visited_at: string; rating: number | null; comment: string; visibility: Visibility; is_favorite: boolean; is_wishlist: boolean; category?: string; created_at: string; updated_at?: string; place?: Place; photos?: Photo[]; tags?: string[] }
export interface Group { id: string; name: string; owner_id: string; role?: GroupRole; member_count?: number; created_at: string }
export interface VisitFormValue { place: Omit<Place, 'id'|'created_by'|'created_at'> & { id?: string }; visited_at: string; rating: number | null; comment: string; visibility: Visibility; is_favorite: boolean; is_wishlist: boolean; category: string; tags: string[]; group_ids: string[] }
export interface ExportBundle { exported_at: string; profile: Profile | null; places: Place[]; visits: Visit[]; groups: Group[] }

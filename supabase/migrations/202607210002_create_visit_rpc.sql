begin;

create or replace function public.create_visit(
  p_place_id uuid,
  p_visited_at date,
  p_rating integer,
  p_comment text,
  p_visibility public.visit_visibility,
  p_is_favorite boolean,
  p_is_wishlist boolean,
  p_category text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_visit_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.places
    where id = p_place_id and created_by = auth.uid()
  ) then
    raise exception 'Place is not owned by the current user';
  end if;

  insert into public.visits (
    place_id, user_id, visited_at, rating, comment, visibility,
    is_favorite, is_wishlist, category
  ) values (
    p_place_id, auth.uid(), p_visited_at, p_rating, coalesce(p_comment, ''),
    coalesce(p_visibility, 'private'), coalesce(p_is_favorite, false),
    coalesce(p_is_wishlist, false), p_category
  ) returning id into new_visit_id;

  return new_visit_id;
end;
$$;

revoke all on function public.create_visit(uuid,date,integer,text,public.visit_visibility,boolean,boolean,text) from public;
grant execute on function public.create_visit(uuid,date,integer,text,public.visit_visibility,boolean,boolean,text) to authenticated;

commit;

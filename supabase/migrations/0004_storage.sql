-- 0004_storage.sql
-- Bucket público para fotografias de produtos e categorias.
-- Leitura pública; escrita apenas por membros activos da equipa.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu-images',
  'menu-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

create policy menu_images_public_read
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'menu-images');

create policy menu_images_staff_insert
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'menu-images' and public.is_staff());

create policy menu_images_staff_update
  on storage.objects for update
  to authenticated
  using (bucket_id = 'menu-images' and public.is_staff())
  with check (bucket_id = 'menu-images' and public.is_staff());

create policy menu_images_staff_delete
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'menu-images' and public.is_staff());

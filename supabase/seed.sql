-- seed.sql
-- Dados estruturais reais (grupos e categorias do PRD §6.1).
-- Nenhum produto, preço ou descrição é semeado: o conteúdo entra por importação validada.

insert into public.menu_groups (name, slug, display_order)
values
  ('Refeições', 'refeicoes', 1),
  ('Sushi', 'sushi', 2),
  ('Bebidas', 'bebidas', 3)
on conflict (slug) do nothing;

insert into public.categories (group_id, name, slug, display_order)
select g.id, v.name, v.slug, v.ord
from public.menu_groups g
join (
  values
    ('refeicoes', 'Entradas e Aperitivos', 'entradas-e-aperitivos', 1),
    ('refeicoes', 'Snacks', 'snacks', 2),
    ('refeicoes', 'Pastas', 'pastas', 3),
    ('refeicoes', 'Peixes', 'peixes', 4),
    ('refeicoes', 'Carnes', 'carnes', 5),
    ('refeicoes', 'Mariscos e Frutos do Mar', 'mariscos-e-frutos-do-mar', 6),
    ('refeicoes', 'Guarnições', 'guarnicoes', 7),
    ('refeicoes', 'Sobremesas', 'sobremesas', 8),
    ('sushi', 'Entradas', 'entradas', 1),
    ('sushi', 'Gunkans', 'gunkans', 2),
    ('sushi', 'Sashimi', 'sashimi', 3),
    ('sushi', 'Temakis', 'temakis', 4),
    ('sushi', 'Quentes / Hot Roll', 'quentes-hot-roll', 5),
    ('sushi', 'Uramaki', 'uramaki', 6),
    ('sushi', 'Combinados', 'combinados', 7),
    ('sushi', 'Massas / Yakissoba', 'massas-yakissoba', 8),
    ('bebidas', 'Cafés e Chás', 'cafes-e-chas', 1),
    ('bebidas', 'Águas', 'aguas', 2),
    ('bebidas', 'Refrigerantes e Energéticas', 'refrigerantes-e-energeticas', 3),
    ('bebidas', 'Sumos', 'sumos', 4),
    ('bebidas', 'Cervejas', 'cervejas', 5),
    ('bebidas', 'Cocktails e Bebidas Mistas', 'cocktails-e-bebidas-mistas', 6),
    ('bebidas', 'Whisky e Brandy', 'whisky-e-brandy', 7),
    ('bebidas', 'Gin e Vodka', 'gin-e-vodka', 8),
    ('bebidas', 'Licores e Vermutes', 'licores-e-vermutes', 9),
    ('bebidas', 'Aguardentes', 'aguardentes', 10),
    ('bebidas', 'Brandes', 'brandes', 11),
    ('bebidas', 'Runs', 'runs', 12),
    ('bebidas', 'Tequilas', 'tequilas', 13),
    ('bebidas', 'Conhaques', 'conhaques', 14),
    ('bebidas', 'Sangrias', 'sangrias', 15),
    ('bebidas', 'Vinhos Tintos', 'vinhos-tintos', 16),
    ('bebidas', 'Vinhos Brancos e Verdes', 'vinhos-brancos-e-verdes', 17),
    ('bebidas', 'Vinhos Rosé', 'vinhos-rose', 18),
    ('bebidas', 'Champanhes e Espumantes', 'champanhes-e-espumantes', 19)
) as v (group_slug, name, slug, ord)
  on v.group_slug = g.slug
on conflict (group_id, slug) do nothing;

-- Configurações: apenas o que é conhecido. Contactos, morada e horário
-- ficam nulos até confirmação do restaurante (não inventar).
insert into public.restaurant_settings (id, name, hours)
values (1, 'La Cabanne', '{}'::jsonb)
on conflict (id) do nothing;

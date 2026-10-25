-- 0001_enums.sql
-- Enums do domínio. Adicionar valores exige migration própria.

create type product_status as enum (
  'draft',
  'published',
  'unavailable',
  'archived'
);

create type admin_role as enum (
  'admin',
  'manager'
);

create type feedback_type as enum (
  'compliment',
  'suggestion',
  'complaint'
);

create type feedback_status as enum (
  'new',
  'in_review',
  'resolved',
  'archived'
);

create type analytics_event_type as enum (
  'menu_opened',
  'group_viewed',
  'category_viewed',
  'product_opened',
  'product_engagement',
  'search_performed',
  'feedback_submitted'
);

create type metric_scope as enum (
  'menu',
  'group',
  'category',
  'product'
);

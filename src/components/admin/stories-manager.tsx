'use client';

import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  GripVertical,
  ImagePlus,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';

import {
  createStoryImageItem,
  createStoryProductItem,
  deleteStoryItem,
  reorderStoryItems,
  updateStoryItemActive,
  updateStorySettings,
} from '@/lib/actions/stories';
import { cn } from '@/lib/utils';
import type { MenuGroup } from '@/types/menu';
import type { StoryConfigItem, StoryMode, StorySettings } from '@/types/stories';
import { ConfirmDialog } from './confirm-dialog';
import { ImageUpload } from './image-upload';
import { StoriesPreview } from './stories-preview';

export type StoryProductOption = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  imageAlt: string;
  groupName: string;
  categoryName: string;
  isStoryHighlight: boolean;
};

export type AdminStoryItem = StoryConfigItem & {
  productName: string | null;
  groupName: string | null;
  categoryName: string | null;
};

type Feedback = { type: 'ok' | 'error'; text: string };

const MODE_OPTIONS: Array<{ value: StoryMode; label: string; description: string }> = [
  {
    value: 'manual',
    label: 'Manual',
    description: 'Usa a lista ordenada abaixo: produtos e imagens soltas.',
  },
  {
    value: 'auto_all',
    label: 'Automático intercalado',
    description: 'Alterna comida, bebidas e sushi, baralhando dentro de cada grupo.',
  },
  {
    value: 'auto_highlight',
    label: 'Automático com destaques',
    description: 'Só produtos marcados com “Destacar nos stories”.',
  },
];

export function StoriesManager({
  initialSettings,
  initialItems,
  products,
  menuGroups,
  highlightCount,
}: {
  initialSettings: StorySettings;
  initialItems: AdminStoryItem[];
  products: StoryProductOption[];
  menuGroups: MenuGroup[];
  highlightCount: number;
}) {
  const router = useRouter();
  const [settings, setSettings] = useState<StorySettings>(initialSettings);
  const [items, setItems] = useState<AdminStoryItem[]>(initialItems);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isPending, startTransition] = useTransition();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminStoryItem | null>(null);

  const [draftImagePath, setDraftImagePath] = useState<string | null>(null);
  const [draftImageAlt, setDraftImageAlt] = useState<string | null>(null);
  const [uploadKey, setUploadKey] = useState(0);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const existingProductIds = useMemo(
    () =>
      new Set(
        items
          .filter((item) => item.itemType === 'product' && item.productId)
          .map((item) => item.productId as string),
      ),
    [items],
  );

  const availableProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return products.filter((product) => {
      if (existingProductIds.has(product.id)) {
        return false;
      }

      if (!normalized) {
        return true;
      }

      return (
        product.name.toLowerCase().includes(normalized) ||
        product.categoryName.toLowerCase().includes(normalized) ||
        product.groupName.toLowerCase().includes(normalized)
      );
    });
  }, [existingProductIds, products, query]);

  function selectMode(mode: StoryMode) {
    setSettings((current) => ({ ...current, mode }));
  }

  function handleSaveSettings() {
    startTransition(async () => {
      const res = await updateStorySettings(settings);

      if (res.success) {
        setFeedback({ type: 'ok', text: res.message || 'Configuração guardada' });
        router.refresh();
      } else {
        setFeedback({ type: 'error', text: res.message || 'Erro ao guardar configuração' });
      }
    });
  }

  function handleAddProduct(product: StoryProductOption) {
    startTransition(async () => {
      const res = await createStoryProductItem(product.id);

      if (res.success) {
        setFeedback({ type: 'ok', text: res.message || 'Produto adicionado' });
        setQuery('');
        router.refresh();
      } else {
        setFeedback({ type: 'error', text: res.message || 'Erro ao adicionar produto' });
      }
    });
  }

  function handleAddImage() {
    if (!draftImagePath || !draftImageAlt?.trim()) {
      setFeedback({ type: 'error', text: 'Escolha uma imagem e preencha o texto alternativo' });
      return;
    }

    startTransition(async () => {
      const res = await createStoryImageItem({
        imagePath: draftImagePath,
        imageAlt: draftImageAlt,
      });

      if (res.success) {
        setFeedback({ type: 'ok', text: res.message || 'Imagem adicionada' });
        setDraftImagePath(null);
        setDraftImageAlt(null);
        setUploadKey((value) => value + 1);
        router.refresh();
      } else {
        setFeedback({ type: 'error', text: res.message || 'Erro ao adicionar imagem' });
      }
    });
  }

  function handleToggleActive(item: AdminStoryItem) {
    const nextValue = !item.isActive;

    startTransition(async () => {
      const res = await updateStoryItemActive(item.id, nextValue);

      if (res.success) {
        setItems((current) =>
          current.map((row) => (row.id === item.id ? { ...row, isActive: nextValue } : row)),
        );
        setFeedback({ type: 'ok', text: res.message || 'Item actualizado' });
      } else {
        setFeedback({ type: 'error', text: res.message || 'Erro ao actualizar item' });
      }
    });
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) {
      return;
    }

    startTransition(async () => {
      const res = await deleteStoryItem(deleteTarget.id);

      if (res.success) {
        setItems((current) => current.filter((row) => row.id !== deleteTarget.id));
        setDeleteTarget(null);
        setFeedback({ type: 'ok', text: res.message || 'Item removido' });
      } else {
        setFeedback({ type: 'error', text: res.message || 'Erro ao remover item' });
        setDeleteTarget(null);
      }
    });
  }

  function persistOrder(next: AdminStoryItem[]) {
    startTransition(async () => {
      const res = await reorderStoryItems(next.map((item) => item.id));

      if (!res.success) {
        setFeedback({ type: 'error', text: res.message || 'Erro ao guardar a ordem' });
        router.refresh();
      }
    });
  }

  function normalizeOrder(next: AdminStoryItem[]) {
    return next.map((item, index) => ({ ...item, sortOrder: index }));
  }

  function moveItem(id: string, direction: -1 | 1) {
    const index = items.findIndex((item) => item.id === id);
    const target = index + direction;

    if (index < 0 || target < 0 || target >= items.length) {
      return;
    }

    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    const normalized = normalizeOrder(next);
    setItems(normalized);
    persistOrder(normalized);
  }

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setDragOverId(null);
      return;
    }

    const from = items.findIndex((item) => item.id === dragId);
    const to = items.findIndex((item) => item.id === targetId);

    if (from < 0 || to < 0) {
      setDragId(null);
      setDragOverId(null);
      return;
    }

    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    const normalized = normalizeOrder(next);
    setItems(normalized);
    setDragId(null);
    setDragOverId(null);
    persistOrder(normalized);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-strong">Stories</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-2">
          Widget flutuante 9:16 no canto inferior esquerdo do menu. Só aparece quando o
          cliente chega à zona do cardápio.
        </p>
      </div>

      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl border p-4 text-sm ${
            feedback.type === 'ok'
              ? 'border-ok/20 bg-ok/10 text-ok'
              : 'border-danger/20 bg-danger/10 text-danger'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="ml-4 text-xs font-semibold uppercase hover:underline"
          >
            Fechar
          </button>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {/* Configuração global */}
          <section className="rounded-2xl border border-line bg-surface p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-xl text-strong">Widget no site</h2>
                <p className="mt-1 text-sm text-ink-2">
                  Ative ou desative os stories em todas as visitas ao menu.
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={settings.enabled}
                aria-label="Ativar stories no site"
                onClick={() =>
                  setSettings((current) => ({ ...current, enabled: !current.enabled }))
                }
                className={cn(
                  'relative mt-1 inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors',
                  settings.enabled ? 'border-blue bg-blue' : 'border-line bg-surface-2',
                )}
              >
                <span
                  className={cn(
                    'inline-block size-4 rounded-full bg-white shadow-xs transition-transform',
                    settings.enabled ? 'translate-x-6' : 'translate-x-1',
                  )}
                />
              </button>
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold tracking-wider text-decor uppercase">
                Modo de funcionamento
              </p>
              <div className="mt-2 grid gap-2 md:grid-cols-3">
                {MODE_OPTIONS.map((option) => {
                  const active = settings.mode === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => selectMode(option.value)}
                      aria-pressed={active}
                      className={cn(
                        'rounded-xl border p-3 text-left transition-colors',
                        active
                          ? 'border-blue bg-blue-tint/50 text-strong'
                          : 'border-line bg-surface text-ink-2 hover:border-blue/40 hover:text-ink',
                      )}
                    >
                      <span className="block text-sm font-medium">{option.label}</span>
                      <span className="mt-1 block text-[11px] leading-relaxed">
                        {option.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {settings.mode === 'auto_highlight' && highlightCount === 0 ? (
              <div className="mt-4 rounded-xl border border-sand-line bg-sand/60 p-3 text-xs text-ink-2">
                Ainda não há produtos destacados. O site vai usar o modo intercalado até
                marcar pelo menos um produto.{' '}
                <Link href="/admin/products" className="font-medium text-blue hover:underline">
                  Marcar produtos
                </Link>
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={isPending}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {isPending && <Loader2 className="size-4 animate-spin" />}
                Guardar configuração
              </button>
              <span className="text-xs text-ink-2">
                Auto-avanço: {settings.intervalSeconds} segundos (em loop)
              </span>
            </div>
          </section>

          {/* Adicionar itens */}
          <section className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="font-display text-xl text-strong">Adicionar itens</h2>
            <p className="mt-1 text-sm text-ink-2">
              Usado no modo manual. No modo automático, a lista é gerada a partir do menu.
            </p>

            <div className="mt-5 grid gap-6 lg:grid-cols-2">
              {/* Produto */}
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold tracking-wider text-decor uppercase">
                    Produto do menu
                  </p>
                  <button
                    type="button"
                    onClick={() => setPickerOpen((value) => !value)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue hover:underline"
                  >
                    <Plus className="size-3.5" />
                    {pickerOpen ? 'Fechar lista' : 'Escolher produto'}
                  </button>
                </div>

                {pickerOpen ? (
                  <div className="mt-2 space-y-2">
                    <div className="relative">
                      <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-decor" />
                      <input
                        type="text"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Pesquisar produto..."
                        className="w-full rounded-lg border border-line bg-surface py-2 pr-3 pl-9 text-sm text-ink focus:border-blue focus:outline-hidden"
                      />
                    </div>

                    {availableProducts.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-line p-3 text-xs text-ink-2">
                        Sem produtos publicados com fotografia disponíveis.
                      </p>
                    ) : (
                      <ul className="max-h-64 divide-y divide-line overflow-y-auto rounded-xl border border-line">
                        {availableProducts.map((product) => (
                          <li
                            key={product.id}
                            className="flex items-center gap-3 px-3 py-2"
                          >
                            <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-md bg-surface-2">
                              <Image
                                src={product.imageUrl}
                                alt={product.imageAlt}
                                fill
                                sizes="36px"
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-ink">
                                {product.isStoryHighlight && (
                                  <Star className="mr-1 inline-block size-3 fill-current text-blue align-[-1px]" />
                                )}
                                {product.name}
                              </p>
                              <p className="truncate text-[11px] text-ink-2">
                                {product.groupName} · {product.categoryName}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddProduct(product)}
                              disabled={isPending}
                              className="shrink-0 rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-ink-2 transition-colors hover:border-blue hover:text-blue disabled:opacity-50"
                            >
                              Adicionar
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Imagem solta */}
              <div>
                <p className="text-xs font-semibold tracking-wider text-decor uppercase">
                  Imagem solta
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-ink-2">
                  Recomendado: imagem vertical 1080×1920. A imagem não abre nenhum produto.
                </p>

                <div className="mt-2">
                  <ImageUpload
                    key={uploadKey}
                    currentPath={draftImagePath}
                    currentAlt={draftImageAlt}
                    onImageChange={(path, alt) => {
                      setDraftImagePath(path);
                      setDraftImageAlt(alt);
                    }}
                    folder="stories"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddImage}
                  disabled={isPending || !draftImagePath || !draftImageAlt?.trim()}
                  className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-line bg-surface-2 px-4 text-sm font-medium text-ink transition-colors hover:bg-line disabled:opacity-50"
                >
                  <ImagePlus className="size-4" />
                  Adicionar imagem aos stories
                </button>
              </div>
            </div>
          </section>

          {/* Lista manual */}
          <section className="rounded-2xl border border-line bg-surface p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-xl text-strong">Lista manual</h2>
                <p className="mt-1 text-sm text-ink-2">
                  Arraste para reordenar ou use as setas. Só é usada no modo Manual.
                </p>
              </div>
              <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink-2">
                {items.length} {items.length === 1 ? 'item' : 'itens'}
              </span>
            </div>

            {items.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-line p-8 text-center">
                <Sparkles className="mx-auto size-8 text-decor" />
                <p className="mt-3 text-sm font-medium text-ink">A lista está vazia</p>
                <p className="mt-1 text-xs text-ink-2">
                  Adicione um produto ou carregue uma imagem para começar.
                </p>
              </div>
            ) : (
              <ul className="mt-5 space-y-2">
                {items.map((item, index) => (
                  <li
                    key={item.id}
                    draggable
                    onDragStart={(event) => {
                      setDragId(item.id);
                      event.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragOverId(item.id);
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      handleDrop(item.id);
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setDragOverId(null);
                    }}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border bg-surface px-3 py-2.5 transition-colors',
                      dragOverId === item.id ? 'border-blue' : 'border-line',
                      !item.isActive && 'opacity-55',
                      dragId === item.id && 'opacity-40',
                    )}
                  >
                    <GripVertical
                      aria-hidden="true"
                      className="size-4 shrink-0 cursor-grab text-decor"
                    />

                    <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-surface-2">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.imageAlt ?? item.productName ?? 'Story'}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-decor">
                          <ImagePlus className="size-4" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {item.productName ?? 'Imagem solta'}
                      </p>
                      <p className="truncate text-[11px] text-ink-2">
                        {item.itemType === 'product'
                          ? [item.groupName, item.categoryName].filter(Boolean).join(' · ')
                          : item.imageAlt}
                      </p>
                      {!item.isActive && (
                        <span className="mt-0.5 inline-block text-[10px] font-semibold tracking-wide text-danger uppercase">
                          Inativo
                        </span>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveItem(item.id, -1)}
                        disabled={index === 0 || isPending}
                        aria-label="Mover para cima"
                        className="rounded-lg p-1.5 text-decor transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-30"
                      >
                        <ArrowUp className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(item.id, 1)}
                        disabled={index === items.length - 1 || isPending}
                        aria-label="Mover para baixo"
                        className="rounded-lg p-1.5 text-decor transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-30"
                      >
                        <ArrowDown className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(item)}
                        disabled={isPending}
                        aria-pressed={item.isActive}
                        aria-label={item.isActive ? 'Desativar item' : 'Ativar item'}
                        className="rounded-lg p-1.5 text-decor transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-50"
                      >
                        {item.isActive ? (
                          <Eye className="size-4" />
                        ) : (
                          <EyeOff className="size-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        disabled={isPending}
                        aria-label="Remover item"
                        className="rounded-lg p-1.5 text-decor transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <StoriesPreview menuGroups={menuGroups} settings={settings} items={items} />

          <div className="rounded-2xl border border-line bg-surface p-5 text-xs text-ink-2">
            <p className="font-semibold text-ink">Como funciona</p>
            <ul className="mt-2 space-y-1.5">
              <li>· O widget só aparece quando o menu entra no ecrã.</li>
              <li>· Na hero inicial não aparece nem a miniatura.</li>
              <li>· O botão de minimizar deixa uma bolinha com a imagem actual.</li>
              <li>· Clicar num produto abre-o no menu e minimiza o widget.</li>
            </ul>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Remover item"
        description={`Remover "${deleteTarget?.productName ?? 'esta imagem'}" dos stories?`}
        confirmLabel="Remover"
        isLoading={isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

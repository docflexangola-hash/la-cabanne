'use client';

import {
  Archive,
  CheckSquare,
  Copy,
  Download,
  Edit2,
  Eye,
  Filter,
  Loader2,
  Plus,
  Search,
  Square,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  bulkUpdateProductStatus,
  deleteProduct,
  duplicateProduct,
  updateProductStatus,
} from '@/lib/actions/products';
import { formatKz } from '@/lib/menu/format';
import { ConfirmDialog } from './confirm-dialog';

export type ProductTableRow = {
  id: string;
  name: string;
  slug: string;
  categoryName: string;
  groupName: string;
  categoryId: string;
  groupId: string;
  basePrice: number | null;
  priceNote: string | null;
  status: 'draft' | 'published' | 'unavailable' | 'archived';
  displayOrder: number;
  hasImage: boolean;
  variantsCount: number;
  publishedAt: string | null;
};

type GroupFilter = { id: string; name: string };
type CategoryFilter = { id: string; name: string; groupId: string };

const STATUS_LABELS: Record<ProductTableRow['status'], { label: string; class: string }> = {
  draft: { label: 'Rascunho', class: 'bg-decor/10 text-decor border-decor/20' },
  published: { label: 'Publicado', class: 'bg-[#2E7D5B]/10 text-[#2E7D5B] border-[#2E7D5B]/20' },
  unavailable: { label: 'Esgotado', class: 'bg-[#B4472F]/10 text-[#B4472F] border-[#B4472F]/20' },
  archived: { label: 'Arquivado', class: 'bg-surface-2 text-ink-2 border-line' },
};

const ITEMS_PER_PAGE = 25;

export function ProductsManager({
  initialProducts,
  groups,
  categories,
}: {
  initialProducts: ProductTableRow[];
  groups: GroupFilter[];
  categories: CategoryFilter[];
}) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [isPending, startTransition] = useTransition();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Confirmation dialogs
  const [deleteTarget, setDeleteTarget] = useState<ProductTableRow | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  // Filter logic
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = selectedGroup === 'all' || p.groupId === selectedGroup;
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || p.status === selectedStatus;
    return matchesSearch && matchesGroup && matchesCategory && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Selection handlers
  function toggleSelectAll() {
    if (selectedIds.length === paginatedProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedProducts.map((p) => p.id));
    }
  }

  function toggleSelectOne(id: string) {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  }

  // Quick status update
  async function handleStatusChange(
    product: ProductTableRow,
    newStatus: ProductTableRow['status'],
  ) {
    startTransition(async () => {
      const res = await updateProductStatus(product.id, newStatus);
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, status: newStatus } : p)),
        );
        setFeedback({ type: 'ok', text: `Estado de "${product.name}" alterado` });
      } else {
        setFeedback({ type: 'error', text: res.message || 'Erro ao alterar estado' });
      }
    });
  }

  // Bulk status update
  async function handleBulkStatus(status: ProductTableRow['status']) {
    if (selectedIds.length === 0) return;

    startTransition(async () => {
      const res = await bulkUpdateProductStatus(selectedIds, status);
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) => (selectedIds.includes(p.id) ? { ...p, status } : p)),
        );
        setSelectedIds([]);
        setFeedback({ type: 'ok', text: res.message || 'Produtos actualizados' });
      } else {
        setFeedback({ type: 'error', text: res.message || 'Erro ao actualizar em massa' });
      }
    });
  }

  // Duplicate product
  async function handleDuplicate(product: ProductTableRow) {
    startTransition(async () => {
      const res = await duplicateProduct(product.id);
      if (res.success) {
        setFeedback({ type: 'ok', text: res.message || 'Produto duplicado' });
        router.refresh();
      } else {
        setFeedback({ type: 'error', text: res.message || 'Erro ao duplicar' });
      }
    });
  }

  // Delete product
  async function handleDeleteConfirm() {
    if (!deleteTarget) return;

    startTransition(async () => {
      const res = await deleteProduct(deleteTarget.id);
      if (res.success) {
        setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
        setDeleteTarget(null);
        setFeedback({ type: 'ok', text: res.message || 'Produto removido' });
      } else {
        setFeedback({ type: 'error', text: res.message || 'Erro ao remover' });
        setDeleteTarget(null);
      }
    });
  }

  // Export to CSV
  function handleExportCsv() {
    const headers = [
      'ID',
      'Nome',
      'Slug',
      'Grupo',
      'Categoria',
      'Preco_Kz',
      'Nota_Preco',
      'Estado',
      'Ordem',
    ];
    const rows = filteredProducts.map((p) => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.slug,
      `"${p.groupName}"`,
      `"${p.categoryName}"`,
      p.basePrice !== null ? p.basePrice : '',
      p.priceNote ? `"${p.priceNote.replace(/"/g, '""')}"` : '',
      p.status,
      p.displayOrder,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `la-cabanne-produtos-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-deep">Produtos</h1>
          <p className="mt-1 text-sm text-ink-2">
            Gestão do cardápio: pratos, bebidas, preços, variantes e fotografias.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredProducts.length === 0}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-medium text-ink-2 hover:bg-surface-2 transition-colors disabled:opacity-50"
            title="Exportar produtos visíveis para CSV"
          >
            <Download className="size-4" />
            Exportar CSV
          </button>

          <Link
            href="/admin/products/new"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue px-4 text-sm font-medium text-white shadow-xs hover:bg-blue-700 transition-colors"
          >
            <Plus className="size-4" />
            Novo Produto
          </Link>
        </div>
      </div>

      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl p-4 text-sm ${
            feedback.type === 'ok'
              ? 'bg-[#2E7D5B]/10 text-[#2E7D5B] border border-[#2E7D5B]/20'
              : 'bg-danger/10 text-danger border border-danger/20'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold uppercase hover:underline ml-4"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-decor" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Pesquisar por prato ou slug..."
              className="w-full rounded-xl border border-line bg-surface-2/40 pl-9 pr-4 py-2 text-sm text-ink focus:border-blue focus:outline-hidden"
            />
          </div>

          {/* Group Filter */}
          <select
            value={selectedGroup}
            onChange={(e) => {
              setSelectedGroup(e.target.value);
              setSelectedCategory('all');
              setCurrentPage(1);
            }}
            className="rounded-xl border border-line bg-white px-3 py-2 text-xs font-medium text-ink focus:border-blue focus:outline-hidden"
          >
            <option value="all">Todos os Grupos</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-xl border border-line bg-white px-3 py-2 text-xs font-medium text-ink focus:border-blue focus:outline-hidden"
          >
            <option value="all">Todas as Categorias</option>
            {categories
              .filter((c) => selectedGroup === 'all' || c.groupId === selectedGroup)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-xl border border-line bg-white px-3 py-2 text-xs font-medium text-ink focus:border-blue focus:outline-hidden"
          >
            <option value="all">Todos os Estados</option>
            <option value="published">Publicados</option>
            <option value="draft">Rascunhos</option>
            <option value="unavailable">Esgotados</option>
            <option value="archived">Arquivados</option>
          </select>
        </div>

        {/* Bulk Action Bar when items are selected */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3 mt-1 bg-blue-tint/40 -mx-4 -mb-4 p-4 rounded-b-2xl">
            <span className="text-xs font-semibold text-deep">
              {selectedIds.length} produto(s) selecionado(s)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleBulkStatus('published')}
                disabled={isPending}
                className="rounded-lg bg-[#2E7D5B] px-3 py-1 text-xs font-medium text-white hover:bg-[#2E7D5B]/90 transition-colors"
              >
                Marcar como Publicado
              </button>
              <button
                type="button"
                onClick={() => handleBulkStatus('unavailable')}
                disabled={isPending}
                className="rounded-lg bg-[#B4472F] px-3 py-1 text-xs font-medium text-white hover:bg-[#B4472F]/90 transition-colors"
              >
                Marcar como Esgotado
              </button>
              <button
                type="button"
                onClick={() => handleBulkStatus('archived')}
                disabled={isPending}
                className="rounded-lg border border-line bg-white px-3 py-1 text-xs font-medium text-ink-2 hover:bg-surface-2 transition-colors"
              >
                Arquivar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        {filteredProducts.length === 0 ? (
          <div className="p-16 text-center">
            <UtensilsCrossed className="mx-auto size-12 text-decor" />
            <p className="mt-4 text-base font-semibold text-deep">Nenhum produto encontrado</p>
            <p className="mt-1 text-xs text-ink-2">
              Ajuste os filtros de pesquisa ou crie o seu primeiro prato.
            </p>
            <Link
              href="/admin/products/new"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <Plus className="size-4" /> Novo Produto
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-surface-2 text-xs font-semibold text-decor uppercase tracking-wider">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="flex items-center justify-center text-decor hover:text-ink"
                    >
                      {selectedIds.length === paginatedProducts.length ? (
                        <CheckSquare className="size-4 text-blue" />
                      ) : (
                        <Square className="size-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3 text-right">Preço</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-right">Acções</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {paginatedProducts.map((product) => {
                  const isSelected = selectedIds.includes(product.id);
                  const statusInfo = STATUS_LABELS[product.status];

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-surface-2/50 transition-colors ${
                        isSelected ? 'bg-blue-tint/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => toggleSelectOne(product.id)}
                          className="flex items-center justify-center text-decor hover:text-ink"
                        >
                          {isSelected ? (
                            <CheckSquare className="size-4 text-blue" />
                          ) : (
                            <Square className="size-4" />
                          )}
                        </button>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="font-medium text-ink hover:text-blue transition-colors line-clamp-1"
                          >
                            {product.name}
                          </Link>
                          <div className="flex items-center gap-2 text-xs text-decor">
                            <span className="font-mono">{product.slug}</span>
                            {product.variantsCount > 0 && (
                              <span className="rounded-full bg-surface-2 px-2 py-0.2 text-[10px] text-ink-2 font-medium">
                                {product.variantsCount} variante(s)
                              </span>
                            )}
                            {product.hasImage && (
                              <span className="text-[10px] text-[#2E7D5B]">📷 foto</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-ink-2">
                        <span className="font-medium text-ink">{product.categoryName}</span>
                        <span className="text-decor"> · {product.groupName}</span>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-right font-medium text-deep">
                        {product.basePrice !== null
                          ? formatKz(product.basePrice)
                          : product.priceNote || '—'}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-center">
                        <select
                          value={product.status}
                          onChange={(e) =>
                            handleStatusChange(
                              product,
                              e.target.value as ProductTableRow['status'],
                            )
                          }
                          disabled={isPending}
                          className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold focus:outline-hidden cursor-pointer ${statusInfo.class}`}
                        >
                          <option value="draft">Rascunho</option>
                          <option value="published">Publicado</option>
                          <option value="unavailable">Esgotado</option>
                          <option value="archived">Arquivado</option>
                        </select>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="rounded-lg p-2 text-decor hover:bg-blue-tint hover:text-blue transition-colors"
                            title="Editar produto"
                          >
                            <Edit2 className="size-4" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleDuplicate(product)}
                            disabled={isPending}
                            className="rounded-lg p-2 text-decor hover:bg-surface-2 hover:text-ink transition-colors"
                            title="Duplicar como rascunho"
                          >
                            <Copy className="size-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget(product)}
                            className="rounded-lg p-2 text-decor hover:bg-danger/10 hover:text-danger transition-colors"
                            title="Remover produto"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-line bg-surface-2/40 px-4 py-3 text-xs text-ink-2">
            <span>
              A mostrar {(currentPage - 1) * ITEMS_PER_PAGE + 1} a{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} de{' '}
              {filteredProducts.length} produtos
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-line bg-white px-3 py-1 font-medium hover:bg-surface-2 disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="px-2 py-1 font-medium text-ink">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-line bg-white px-3 py-1 font-medium hover:bg-surface-2 disabled:opacity-40"
              >
                Seguinte
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Remover Produto"
        description={`Tem a certeza que deseja remover o produto "${deleteTarget?.name}"? Esta acção eliminará também as variantes associadas.`}
        confirmLabel="Remover"
        isLoading={isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

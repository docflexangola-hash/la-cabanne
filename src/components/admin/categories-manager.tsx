'use client';

import {
  ArrowDown,
  ArrowUp,
  Check,
  Edit2,
  FolderPlus,
  Loader2,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useState, useTransition } from 'react';
import {
  createCategory,
  deleteCategory,
  reorderCategories,
  toggleCategoryActive,
  updateCategory,
} from '@/lib/actions/categories';
import { slugify } from '@/lib/utils';
import { ConfirmDialog } from './confirm-dialog';

export type CategoryRowData = {
  id: string;
  groupId: string;
  groupName: string;
  groupSlug: string;
  name: string;
  slug: string;
  displayOrder: number;
  isActive: boolean;
  imagePath: string | null;
  productCount: number;
};

export type GroupOption = {
  id: string;
  name: string;
  slug: string;
};

export function CategoriesManager({
  initialCategories,
  groups,
}: {
  initialCategories: CategoryRowData[];
  groups: GroupOption[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRowData | null>(null);
  const [formData, setFormData] = useState({
    groupId: groups[0]?.id || '',
    name: '',
    slug: '',
    displayOrder: 0,
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<CategoryRowData | null>(null);

  // Filter categories
  const filteredCategories = categories.filter((c) => {
    const matchesGroup = selectedGroupId === 'all' || c.groupId === selectedGroupId;
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  // Open creation modal
  function openCreateModal() {
    setEditingCategory(null);
    setFormData({
      groupId: selectedGroupId !== 'all' ? selectedGroupId : groups[0]?.id || '',
      name: '',
      slug: '',
      displayOrder: categories.length + 1,
      isActive: true,
    });
    setFormErrors({});
    setIsFormOpen(true);
  }

  // Open edit modal
  function openEditModal(category: CategoryRowData) {
    setEditingCategory(category);
    setFormData({
      groupId: category.groupId,
      name: category.name,
      slug: category.slug,
      displayOrder: category.displayOrder,
      isActive: category.isActive,
    });
    setFormErrors({});
    setIsFormOpen(true);
  }

  // Handle name change with auto-slug
  function handleNameChange(name: string) {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: !editingCategory ? slugify(name) : prev.slug,
    }));
  }

  // Handle form submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormErrors({});
    setFeedbackMessage(null);

    startTransition(async () => {
      let res;
      if (editingCategory) {
        res = await updateCategory(editingCategory.id, formData);
      } else {
        res = await createCategory(formData);
      }

      if (res.success) {
        setFeedbackMessage({ type: 'ok', text: res.message || 'Operação realizada' });
        setIsFormOpen(false);
        // Refresh local state or re-sync
        if (editingCategory) {
          const groupName = groups.find((g) => g.id === formData.groupId)?.name || '';
          setCategories((prev) =>
            prev.map((c) =>
              c.id === editingCategory.id
                ? {
                    ...c,
                    groupId: formData.groupId,
                    groupName,
                    name: formData.name,
                    slug: formData.slug,
                    displayOrder: formData.displayOrder,
                    isActive: formData.isActive,
                  }
                : c,
            ),
          );
        } else {
          window.location.reload();
        }
      } else {
        setFormErrors(res.errors || {});
        setFeedbackMessage({ type: 'error', text: res.message || 'Erro ao processar' });
      }
    });
  }

  // Toggle category active
  async function handleToggleActive(category: CategoryRowData) {
    startTransition(async () => {
      const res = await toggleCategoryActive(category.id, !category.isActive);
      if (res.success) {
        setCategories((prev) =>
          prev.map((c) => (c.id === category.id ? { ...c, isActive: !c.isActive } : c)),
        );
      } else {
        setFeedbackMessage({ type: 'error', text: res.message || 'Erro ao alterar estado' });
      }
    });
  }

  // Delete category
  async function handleDeleteConfirm() {
    if (!deleteTarget) return;

    startTransition(async () => {
      const res = await deleteCategory(deleteTarget.id);
      if (res.success) {
        setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
        setFeedbackMessage({ type: 'ok', text: res.message || 'Categoria removida' });
        setDeleteTarget(null);
      } else {
        setFeedbackMessage({ type: 'error', text: res.message || 'Erro ao remover' });
        setDeleteTarget(null);
      }
    });
  }

  // Move category up/down in list
  async function handleMove(category: CategoryRowData, direction: 'up' | 'down') {
    const groupItems = categories
      .filter((c) => c.groupId === category.groupId)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    const index = groupItems.findIndex((c) => c.id === category.id);
    if (direction === 'up' && index <= 0) return;
    if (direction === 'down' && index >= groupItems.length - 1) return;

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const targetItem = groupItems[swapIndex];

    const updated = categories.map((c) => {
      if (c.id === category.id) return { ...c, displayOrder: targetItem.displayOrder };
      if (c.id === targetItem.id) return { ...c, displayOrder: category.displayOrder };
      return c;
    });

    setCategories(updated);

    startTransition(async () => {
      await reorderCategories([
        { id: category.id, displayOrder: targetItem.displayOrder },
        { id: targetItem.id, displayOrder: category.displayOrder },
      ]);
    });
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-deep">Categorias</h1>
          <p className="mt-1 text-sm text-ink-2">
            Organize o cardápio em grupos e categorias de refeições, sushi e bebidas.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue px-4 text-sm font-medium text-white shadow-xs hover:bg-blue-700 transition-colors"
        >
          <Plus className="size-4" />
          Nova Categoria
        </button>
      </div>

      {feedbackMessage && (
        <div
          className={`flex items-center justify-between rounded-xl p-4 text-sm ${
            feedbackMessage.type === 'ok'
              ? 'bg-[#2E7D5B]/10 text-[#2E7D5B] border border-[#2E7D5B]/20'
              : 'bg-danger/10 text-danger border border-danger/20'
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-xs font-semibold uppercase hover:underline ml-4"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Group tabs / select */}
        <div className="flex flex-wrap gap-1 rounded-xl bg-surface-2 p-1 border border-line">
          <button
            type="button"
            onClick={() => setSelectedGroupId('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedGroupId === 'all'
                ? 'bg-white text-deep shadow-xs'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            Todos ({categories.length})
          </button>
          {groups.map((group) => {
            const count = categories.filter((c) => c.groupId === group.id).length;
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => setSelectedGroupId(group.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedGroupId === group.id
                    ? 'bg-white text-deep shadow-xs'
                    : 'text-ink-2 hover:text-ink'
                }`}
              >
                {group.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-decor" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar categoria..."
            className="w-full rounded-xl border border-line bg-white pl-9 pr-4 py-2 text-sm text-ink focus:border-blue focus:outline-hidden"
          />
        </div>
      </div>

      {/* Categories Table */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        {filteredCategories.length === 0 ? (
          <div className="p-12 text-center">
            <FolderPlus className="mx-auto size-10 text-decor" />
            <p className="mt-3 text-sm font-medium text-ink">Nenhuma categoria encontrada</p>
            <p className="mt-1 text-xs text-ink-2">Crie uma categoria ou ajuste os filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-surface-2 text-xs font-semibold text-decor uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Ordem</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Grupo</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3 text-center">Produtos</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-right">Acções</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-surface-2/50 transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs text-decor w-6">
                          {category.displayOrder}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleMove(category, 'up')}
                          disabled={isPending}
                          className="rounded p-1 text-decor hover:bg-surface-2 hover:text-ink disabled:opacity-30"
                          title="Mover para cima"
                        >
                          <ArrowUp className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(category, 'down')}
                          disabled={isPending}
                          className="rounded p-1 text-decor hover:bg-surface-2 hover:text-ink disabled:opacity-30"
                          title="Mover para baixo"
                        >
                          <ArrowDown className="size-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-medium text-ink">{category.name}</span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-ink-2">
                      <span className="inline-flex rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-ink">
                        {category.groupName}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap font-mono text-xs text-decor">
                      {category.slug}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-center">
                      <span className="inline-flex items-center justify-center rounded-full bg-blue-tint px-2.5 py-0.5 text-xs font-medium text-deep">
                        {category.productCount}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(category)}
                        disabled={isPending}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                          category.isActive
                            ? 'bg-[#2E7D5B]/10 text-[#2E7D5B] hover:bg-[#2E7D5B]/20'
                            : 'bg-decor/10 text-decor hover:bg-decor/20'
                        }`}
                      >
                        {category.isActive ? 'Activa' : 'Inactiva'}
                      </button>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(category)}
                          className="rounded-lg p-2 text-decor hover:bg-blue-tint hover:text-blue transition-colors"
                          title="Editar categoria"
                        >
                          <Edit2 className="size-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(category)}
                          className="rounded-lg p-2 text-decor hover:bg-danger/10 hover:text-danger transition-colors"
                          title="Remover categoria"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Criar / Editar Categoria */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-2xl">
            <h2 className="font-display text-2xl text-deep">
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </h2>
            <p className="mt-1 text-xs text-ink-2">
              Defina o nome, grupo e ordem de apresentação no cardápio.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-decor uppercase">
                  Grupo <span className="text-danger">*</span>
                </label>
                <select
                  value={formData.groupId}
                  onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink bg-white focus:border-blue focus:outline-hidden"
                  required
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
                {formErrors.groupId && (
                  <p className="mt-1 text-xs text-danger">{formErrors.groupId[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-decor uppercase">
                  Nome <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex.: Sobremesas"
                  className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:border-blue focus:outline-hidden"
                  required
                />
                {formErrors.name && (
                  <p className="mt-1 text-xs text-danger">{formErrors.name[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-decor uppercase">
                  Slug (URL) <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="sobremesas"
                  className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm font-mono text-ink focus:border-blue focus:outline-hidden"
                  required
                />
                {formErrors.slug && (
                  <p className="mt-1 text-xs text-danger">{formErrors.slug[0]}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-decor uppercase">
                    Ordem de exibição
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, displayOrder: parseInt(e.target.value, 10) || 0 })
                    }
                    className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:border-blue focus:outline-hidden"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="size-4 rounded border-line text-blue focus:ring-blue"
                    />
                    <span className="text-sm font-medium text-ink">Activa no menu</span>
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  disabled={isPending}
                  className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink-2 hover:bg-surface-2 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isPending && <Loader2 className="size-4 animate-spin" />}
                  {editingCategory ? 'Guardar Alterações' : 'Criar Categoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Remover Categoria"
        description={
          deleteTarget?.productCount && deleteTarget.productCount > 0
            ? `Esta categoria contém ${deleteTarget.productCount} produto(s). Não pode ser removida antes de reatribuir ou eliminar os seus produtos.`
            : `Tem a certeza que deseja remover a categoria "${deleteTarget?.name}"? Esta acção não pode ser revertida.`
        }
        confirmLabel="Remover"
        isLoading={isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

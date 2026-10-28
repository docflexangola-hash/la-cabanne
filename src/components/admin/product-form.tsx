'use client';

import {
  ArrowLeft,
  Check,
  Eye,
  Info,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { createProduct, updateProduct } from '@/lib/actions/products';
import { formatKz } from '@/lib/menu/format';
import { slugify } from '@/lib/utils';
import type { ProductInput, VariantGroupInput } from '@/lib/validations/product';
import { ImageUpload } from './image-upload';

const COMMON_ALLERGENS = [
  'Glúten',
  'Crustáceos',
  'Ovos',
  'Peixe',
  'Amendoins',
  'Soja',
  'Leite / Lactose',
  'Frutos de Casca Rija',
  'Aipo',
  'Mostarda',
  'Sementes de Sésamo',
  'Moluscos',
];

const COMMON_TAGS = ['Especialidade', 'Recomendado', 'Novo', 'Vegetariano', 'Picante', 'Sem Glúten'];

export type CategoryOption = {
  id: string;
  name: string;
  groupName: string;
};

type ProductFormProps = {
  initialData?: (ProductInput & { id: string }) | null;
  categories: CategoryOption[];
};

export function ProductForm({ initialData, categories }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [categoryId, setCategoryId] = useState(initialData?.categoryId || categories[0]?.id || '');
  const [name, setName] = useState(initialData?.name || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [pricingType, setPricingType] = useState<'fixed' | 'note' | 'variants'>(
    initialData?.variantGroups?.length
      ? 'variants'
      : initialData?.priceNote
        ? 'note'
        : 'fixed',
  );
  const [basePrice, setBasePrice] = useState<number | string>(
    initialData?.basePrice !== null && initialData?.basePrice !== undefined
      ? initialData.basePrice
      : '',
  );
  const [priceNote, setPriceNote] = useState(initialData?.priceNote || '');
  const [variantGroups, setVariantGroups] = useState<VariantGroupInput[]>(
    initialData?.variantGroups || [],
  );
  const [serves, setServes] = useState(initialData?.serves || '');
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [customTag, setCustomTag] = useState('');
  const [allergens, setAllergens] = useState<string[]>(initialData?.allergens || []);
  const [imagePath, setImagePath] = useState<string | null>(initialData?.imagePath || null);
  const [imageAlt, setImageAlt] = useState<string | null>(initialData?.imageAlt || null);
  const [status, setStatus] = useState<ProductInput['status']>(initialData?.status || 'draft');
  const [displayOrder, setDisplayOrder] = useState<number>(initialData?.displayOrder || 0);

  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-slug on name change if creating
  function handleNameChange(val: string) {
    setName(val);
    if (!initialData) {
      setSlug(slugify(val));
    }
  }

  // Variant groups helpers
  function addVariantGroup() {
    setVariantGroups([
      ...variantGroups,
      {
        name: 'Opção',
        isRequired: true,
        displayOrder: variantGroups.length + 1,
        variants: [
          { name: 'Normal', price: 0, displayOrder: 1, isActive: true },
        ],
      },
    ]);
  }

  function removeVariantGroup(index: number) {
    setVariantGroups(variantGroups.filter((_, i) => i !== index));
  }

  function updateVariantGroup(index: number, field: keyof VariantGroupInput, val: unknown) {
    const updated = [...variantGroups];
    updated[index] = { ...updated[index], [field]: val };
    setVariantGroups(updated);
  }

  function addVariantOption(groupIndex: number) {
    const updated = [...variantGroups];
    updated[groupIndex].variants.push({
      name: '',
      price: 0,
      displayOrder: updated[groupIndex].variants.length + 1,
      isActive: true,
    });
    setVariantGroups(updated);
  }

  function removeVariantOption(groupIndex: number, optIndex: number) {
    const updated = [...variantGroups];
    updated[groupIndex].variants = updated[groupIndex].variants.filter((_, i) => i !== optIndex);
    setVariantGroups(updated);
  }

  function updateVariantOption(
    groupIndex: number,
    optIndex: number,
    field: string,
    val: unknown,
  ) {
    const updated = [...variantGroups];
    updated[groupIndex].variants[optIndex] = {
      ...updated[groupIndex].variants[optIndex],
      [field]: val,
    };
    setVariantGroups(updated);
  }

  // Tags helpers
  function toggleTag(tag: string) {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  }

  function handleAddCustomTag() {
    if (!customTag.trim()) return;
    if (!tags.includes(customTag.trim())) {
      setTags([...tags, customTag.trim()]);
    }
    setCustomTag('');
  }

  // Allergens helpers
  function toggleAllergen(allergen: string) {
    if (allergens.includes(allergen)) {
      setAllergens(allergens.filter((a) => a !== allergen));
    } else {
      setAllergens([...allergens, allergen]);
    }
  }

  // Submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormErrors({});
    setErrorMessage(null);

    const parsedPrice =
      pricingType === 'fixed' && basePrice !== '' ? Number(basePrice) : null;
    const finalPriceNote = pricingType === 'note' ? priceNote : null;
    const finalVariantGroups = pricingType === 'variants' ? variantGroups : [];

    const payload: ProductInput = {
      categoryId,
      name,
      slug,
      description: description || null,
      basePrice: parsedPrice,
      priceNote: finalPriceNote,
      imagePath,
      imageAlt,
      tags,
      allergens,
      serves: serves || null,
      status,
      displayOrder,
      variantGroups: finalVariantGroups,
    };

    startTransition(async () => {
      let res;
      if (initialData?.id) {
        res = await updateProduct(initialData.id, payload);
      } else {
        res = await createProduct(payload);
      }

      if (res.success) {
        router.push('/admin/products');
        router.refresh();
      } else {
        setFormErrors(res.errors || {});
        setErrorMessage(res.message || 'Erro ao guardar produto');
      }
    });
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top back link */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 text-sm font-medium text-ink-2 hover:text-ink transition-colors"
        >
          <ArrowLeft className="size-4" />
          Voltar aos produtos
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-deep">
            {initialData ? `Editar: ${initialData.name}` : 'Novo Produto'}
          </h1>
          <p className="mt-1 text-sm text-ink-2">
            Preencha os detalhes do prato, bebida ou produto do cardápio.
          </p>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-decor uppercase">Estado:</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ProductInput['status'])}
            className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-medium text-ink focus:border-blue focus:outline-hidden"
          >
            <option value="draft">Rascunho</option>
            <option value="published">Publicado</option>
            <option value="unavailable">Esgotado</option>
            <option value="archived">Arquivado</option>
          </select>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main 2 columns: info and pricing */}
          <div className="space-y-6 lg:col-span-2">
            {/* Basic Info */}
            <div className="rounded-2xl border border-line bg-white p-6 space-y-4">
              <h2 className="font-display text-xl text-deep">Informação Principal</h2>

              <div>
                <label className="block text-xs font-semibold text-decor uppercase">
                  Categoria <span className="text-danger">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink bg-white focus:border-blue focus:outline-hidden"
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.groupName} → {c.name}
                    </option>
                  ))}
                </select>
                {formErrors.categoryId && (
                  <p className="mt-1 text-xs text-danger">{formErrors.categoryId[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-decor uppercase">
                  Nome do Produto <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex.: Peito de Pato com Molho de Laranja"
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
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="peito-de-pato-com-molho-de-laranja"
                  className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm font-mono text-ink focus:border-blue focus:outline-hidden"
                  required
                />
                {formErrors.slug && (
                  <p className="mt-1 text-xs text-danger">{formErrors.slug[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-decor uppercase">
                  Descrição
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Acompanha puré de batata doce e legumes salteados na manteiga aromática..."
                  className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:border-blue focus:outline-hidden resize-y"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-decor uppercase">
                    Doses / Quantidade
                  </label>
                  <input
                    type="text"
                    value={serves}
                    onChange={(e) => setServes(e.target.value)}
                    placeholder="Ex.: 2 pessoas, 330ml, 8 unid."
                    className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:border-blue focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-decor uppercase">
                    Ordem de Exibição
                  </label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
                    className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:border-blue focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="rounded-2xl border border-line bg-white p-6 space-y-4">
              <h2 className="font-display text-xl text-deep">Preço e Variantes</h2>

              {/* Pricing type selector */}
              <div className="flex gap-2 rounded-xl bg-surface-2 p-1 border border-line">
                <button
                  type="button"
                  onClick={() => setPricingType('fixed')}
                  className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${
                    pricingType === 'fixed'
                      ? 'bg-white text-deep shadow-xs'
                      : 'text-ink-2 hover:text-ink'
                  }`}
                >
                  Preço Fixo
                </button>
                <button
                  type="button"
                  onClick={() => setPricingType('variants')}
                  className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${
                    pricingType === 'variants'
                      ? 'bg-white text-deep shadow-xs'
                      : 'text-ink-2 hover:text-ink'
                  }`}
                >
                  Com Variantes
                </button>
                <button
                  type="button"
                  onClick={() => setPricingType('note')}
                  className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${
                    pricingType === 'note'
                      ? 'bg-white text-deep shadow-xs'
                      : 'text-ink-2 hover:text-ink'
                  }`}
                >
                  Sob Consulta / Nota
                </button>
              </div>

              {pricingType === 'fixed' && (
                <div>
                  <label className="block text-xs font-semibold text-decor uppercase">
                    Preço Base em Kwanzas (Kz) <span className="text-danger">*</span>
                  </label>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                      placeholder="Ex.: 8500"
                      className="w-full rounded-lg border border-line px-3 py-2 pr-12 text-sm font-medium text-ink focus:border-blue focus:outline-hidden"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-decor">
                      Kz
                    </span>
                  </div>
                  {formErrors.basePrice && (
                    <p className="mt-1 text-xs text-danger">{formErrors.basePrice[0]}</p>
                  )}
                  {Number(basePrice) > 0 && (
                    <p className="mt-1 text-xs text-ink-2">
                      Aparecerá como: <strong className="text-deep">{formatKz(Number(basePrice))}</strong>
                    </p>
                  )}
                </div>
              )}

              {pricingType === 'note' && (
                <div>
                  <label className="block text-xs font-semibold text-decor uppercase">
                    Nota de Preço <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={priceNote}
                    onChange={(e) => setPriceNote(e.target.value)}
                    placeholder="Ex.: Preço sob consulta, Ao kg"
                    className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:border-blue focus:outline-hidden"
                    required
                  />
                  {formErrors.priceNote && (
                    <p className="mt-1 text-xs text-danger">{formErrors.priceNote[0]}</p>
                  )}
                </div>
              )}

              {pricingType === 'variants' && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-ink-2">
                      Configure opções de dose ou tamanho com preços absolutos.
                    </p>
                    <button
                      type="button"
                      onClick={addVariantGroup}
                      className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface-2 px-3 py-1 text-xs font-medium text-deep hover:bg-white transition-colors"
                    >
                      <Plus className="size-3.5" />
                      Adicionar Grupo
                    </button>
                  </div>

                  {variantGroups.map((group, gIdx) => (
                    <div key={gIdx} className="rounded-xl border border-line bg-surface-2/60 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <input
                          type="text"
                          value={group.name}
                          onChange={(e) => updateVariantGroup(gIdx, 'name', e.target.value)}
                          placeholder="Nome do grupo (ex.: Tamanho, Dose)"
                          className="flex-1 rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-medium text-ink focus:border-blue focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => removeVariantGroup(gIdx)}
                          className="rounded p-1 text-danger hover:bg-danger/10 transition-colors"
                          title="Remover grupo"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>

                      {/* Options in group */}
                      <div className="space-y-2 pl-2 border-l-2 border-line">
                        {group.variants.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={opt.name}
                              onChange={(e) =>
                                updateVariantOption(gIdx, oIdx, 'name', e.target.value)
                              }
                              placeholder="Opção (ex.: Meia dose)"
                              className="flex-1 rounded-lg border border-line bg-white px-3 py-1 text-sm text-ink focus:border-blue focus:outline-hidden"
                            />
                            <div className="relative w-32">
                              <input
                                type="number"
                                min="0"
                                value={opt.price}
                                onChange={(e) =>
                                  updateVariantOption(
                                    gIdx,
                                    oIdx,
                                    'price',
                                    Number(e.target.value) || 0,
                                  )
                                }
                                placeholder="Preço"
                                className="w-full rounded-lg border border-line bg-white px-3 py-1 pr-8 text-sm font-medium text-ink focus:border-blue focus:outline-hidden"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-decor">
                                Kz
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeVariantOption(gIdx, oIdx)}
                              disabled={group.variants.length <= 1}
                              className="rounded p-1 text-decor hover:text-danger disabled:opacity-20"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => addVariantOption(gIdx)}
                          className="mt-2 text-xs font-medium text-blue hover:underline inline-flex items-center gap-1"
                        >
                          <Plus className="size-3" /> Adicionar opção
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tags & Allergens */}
            <div className="rounded-2xl border border-line bg-white p-6 space-y-5">
              <div>
                <h3 className="font-display text-lg text-deep mb-2">Etiquetas (Badges)</h3>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_TAGS.map((tag) => {
                    const active = tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          active
                            ? 'bg-blue text-white'
                            : 'bg-surface-2 text-ink-2 hover:bg-line'
                        }`}
                      >
                        {active && <Check className="inline-block mr-1 size-3" />}
                        {tag}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    placeholder="Outra etiqueta..."
                    className="w-48 rounded-lg border border-line px-3 py-1 text-xs text-ink focus:border-blue focus:outline-hidden"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomTag();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTag}
                    className="rounded-lg border border-line bg-surface-2 px-3 py-1 text-xs font-medium text-ink hover:bg-line"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-line">
                <h3 className="font-display text-lg text-deep mb-2">Alergénios</h3>
                <p className="text-xs text-ink-2 mb-3">
                  Selecione os alergénios presentes neste produto para salvaguarda dos clientes.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_ALLERGENS.map((allergen) => {
                    const active = allergens.includes(allergen);
                    return (
                      <button
                        key={allergen}
                        type="button"
                        onClick={() => toggleAllergen(allergen)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          active
                            ? 'bg-danger text-white'
                            : 'bg-surface-2 text-ink-2 hover:bg-line'
                        }`}
                      >
                        {active && <Check className="inline-block mr-1 size-3" />}
                        {allergen}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar column: Photography + Public Card Preview */}
          <div className="space-y-6">
            {/* Photography upload */}
            <div className="rounded-2xl border border-line bg-white p-6">
              <ImageUpload
                currentPath={imagePath}
                currentAlt={imageAlt}
                onImageChange={(path, alt) => {
                  setImagePath(path);
                  setImageAlt(alt);
                }}
                folder="products"
              />
              {formErrors.imageAlt && (
                <p className="mt-2 text-xs text-danger">{formErrors.imageAlt[0]}</p>
              )}
            </div>

            {/* Live Preview Card in "Editorial de Mesa" style */}
            <div className="rounded-2xl border border-line bg-white p-6 space-y-3">
              <div className="flex items-center gap-2 text-decor">
                <Eye className="size-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Pré-visualização pública
                </span>
              </div>

              <div className="rounded-xl border border-line bg-ivory p-4 shadow-xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-display text-lg text-ink font-semibold leading-tight">
                      {name || 'Nome do Prato'}
                    </p>
                    {description && (
                      <p className="text-xs text-ink-2 line-clamp-2">{description}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-display text-base font-bold text-deep">
                      {pricingType === 'fixed' && basePrice !== ''
                        ? formatKz(Number(basePrice))
                        : pricingType === 'variants' && variantGroups[0]?.variants[0]
                          ? `desde ${formatKz(variantGroups[0].variants[0].price)}`
                          : priceNote || '— Kz'}
                    </p>
                  </div>
                </div>

                {tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-blue-tint px-2 py-0.5 text-[10px] font-medium text-deep"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submit action bar */}
        <div className="sticky bottom-4 z-20 flex items-center justify-end gap-3 rounded-2xl border border-line bg-white/95 p-4 shadow-lg backdrop-blur">
          <Link
            href="/admin/products"
            className="rounded-lg border border-line px-5 py-2.5 text-sm font-medium text-ink-2 hover:bg-surface-2 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-blue px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-xs disabled:opacity-50"
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {initialData ? 'Guardar Alterações' : 'Criar Produto'}
          </button>
        </div>
      </form>
    </div>
  );
}

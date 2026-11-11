import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import { getClientIp, getIpHash, rateLimit } from '@/lib/utils/rate-limit';
import { orderSchema, type OrderItemInput } from '@/lib/validations/order';

type ProductRow = {
  id: string;
  name: string;
  base_price: number | null;
};

type VariantRow = {
  id: string;
  name: string;
  price: number;
  group_id: string;
  variant_groups: { id: string; name: string; product_id: string } | null;
};

type ExistingOrder = {
  id: string;
  round_number: number;
  total: number;
  item_count: number;
  created_at: string;
};

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, { auth: { persistSession: false } });
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function resolveItem(
  item: OrderItemInput,
  products: Map<string, ProductRow>,
  variants: Map<string, VariantRow>,
) {
  const product = products.get(item.productId);

  if (item.variantIds.length > 0) {
    const chosen = item.variantIds
      .map((id) => variants.get(id))
      .filter((variant): variant is VariantRow => Boolean(variant))
      .filter(
        (variant) =>
          !variant.variant_groups || variant.variant_groups.product_id === item.productId,
      );

    if (chosen.length === item.variantIds.length && chosen.length > 0) {
      return {
        productName: product?.name ?? item.productName,
        variantLabel: chosen.map((variant) => variant.name).join(' · ').slice(0, 120),
        unitPrice: roundMoney(
          chosen.reduce((sum, variant) => sum + Number(variant.price), 0),
        ),
        quantity: item.quantity,
      };
    }
  }

  if (product && product.base_price !== null) {
    return {
      productName: product.name,
      variantLabel: null,
      unitPrice: Number(product.base_price),
      quantity: item.quantity,
    };
  }

  // Produto/variante entretanto removido: preservar o snapshot do cliente.
  return {
    productName: item.productName,
    variantLabel: item.variantLabel ?? null,
    unitPrice: roundMoney(item.unitPrice),
    quantity: item.quantity,
  };
}

async function findExistingOrder(
  supabase: NonNullable<ReturnType<typeof getServiceClient>>,
  input: { clientOrderId: string; sessionId: string; roundNumber: number },
): Promise<ExistingOrder | null> {
  const select = 'id, round_number, total, item_count, created_at';

  const byClient = await supabase
    .from('orders')
    .select(select)
    .eq('client_order_id', input.clientOrderId)
    .maybeSingle();

  if (byClient.data) {
    return byClient.data as ExistingOrder;
  }

  const byRound = await supabase
    .from('orders')
    .select(select)
    .eq('session_id', input.sessionId)
    .eq('round_number', input.roundNumber)
    .maybeSingle();

  return (byRound.data as ExistingOrder | null) ?? null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = orderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Dados inválidos' }, { status: 400 });
    }

    const data = parsed.data;

    // Honeypot
    if (data.website && data.website.trim().length > 0) {
      return NextResponse.json({ ok: true }, { status: 201 });
    }

    const ip = getClientIp(request);
    const ipHash = getIpHash(ip);
    const limit = await rateLimit({
      key: `orders:${ipHash || 'unknown'}`,
      limit: 12,
      windowSeconds: 3600,
    });

    if (!limit.allowed) {
      return NextResponse.json(
        { ok: false, error: 'Limite de pedidos atingido. Tente mais tarde.' },
        { status: 429 },
      );
    }

    const supabase = getServiceClient();

    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: 'Serviço indisponível' },
        { status: 503 },
      );
    }

    // Recalcular preços a partir do catálogo, nunca confiar no cliente.
    const productIds = [...new Set(data.items.map((item) => item.productId))];
    const variantIds = [...new Set(data.items.flatMap((item) => item.variantIds))];

    const { data: productRows } = await supabase
      .from('products')
      .select('id, name, base_price')
      .in('id', productIds);

    let variantRows: VariantRow[] = [];

    if (variantIds.length > 0) {
      const { data: variants } = await supabase
        .from('product_variants')
        .select('id, name, price, group_id, variant_groups ( id, name, product_id )')
        .in('id', variantIds);

      variantRows = (variants ?? []) as unknown as VariantRow[];
    }

    const products = new Map<string, ProductRow>(
      ((productRows ?? []) as ProductRow[]).map((product) => [product.id, product]),
    );
    const variants = new Map<string, VariantRow>(
      variantRows.map((variant) => [variant.id, variant]),
    );

    const resolvedItems = data.items.map((item) => ({
      source: item,
      ...resolveItem(item, products, variants),
    }));

    const total = roundMoney(
      resolvedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    );
    const itemCount = resolvedItems.reduce((sum, item) => sum + item.quantity, 0);

    if (itemCount > 500) {
      return NextResponse.json(
        { ok: false, error: 'Pedido demasiado grande.' },
        { status: 400 },
      );
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        client_order_id: data.clientOrderId,
        device_id: data.deviceId,
        session_id: data.sessionId,
        round_number: data.roundNumber,
        table_label: data.tableLabel ?? null,
        total,
        item_count: itemCount,
        source_path: data.sourcePath || null,
        ip_hash: ipHash,
      })
      .select('id, round_number, total, item_count, created_at')
      .single();

    if (orderError) {
      // Reenvio da mesma rodada: devolver o pedido já gravado.
      if (orderError.code === '23505') {
        const existing = await findExistingOrder(supabase, data);

        if (existing) {
          return NextResponse.json(
            {
              ok: true,
              orderId: existing.id,
              roundNumber: existing.round_number,
              total: Number(existing.total),
              itemCount: existing.item_count,
              createdAt: existing.created_at,
            },
            { status: 200 },
          );
        }
      }

      console.error('[orders] insert failed', {
        code: orderError.code,
        message: orderError.message,
        details: orderError.details,
        hint: orderError.hint,
      });

      return NextResponse.json(
        { ok: false, error: 'Não foi possível registar o pedido.' },
        { status: 500 },
      );
    }

    const { error: itemsError } = await supabase.from('order_items').insert(
      resolvedItems.map((item) => ({
        order_id: order.id,
        product_id: products.has(item.source.productId) ? item.source.productId : null,
        product_name: item.productName,
        variant_label: item.variantLabel,
        unit_price: item.unitPrice,
        quantity: item.quantity,
        line_total: roundMoney(item.unitPrice * item.quantity),
      })),
    );

    if (itemsError) {
      // Não deixar uma order sem itens.
      await supabase.from('orders').delete().eq('id', order.id);

      console.error('[orders] items insert failed', {
        code: itemsError.code,
        message: itemsError.message,
        details: itemsError.details,
        hint: itemsError.hint,
      });

      return NextResponse.json(
        { ok: false, error: 'Não foi possível registar o pedido.' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        orderId: order.id,
        roundNumber: order.round_number,
        total: Number(order.total),
        itemCount: order.item_count,
        createdAt: order.created_at,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('[orders] unexpected error', error);

    return NextResponse.json(
      { ok: false, error: 'Não foi possível registar o pedido.' },
      { status: 500 },
    );
  }
}

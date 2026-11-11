'use server';

import { revalidatePath } from 'next/cache';

import { requireStaff } from '@/lib/auth/guard';
import { ORDER_STATUSES, type OrderStatus } from '@/lib/orders/types';
import { createClient } from '@/lib/supabase/server';

export type OrderActionResponse = {
  success: boolean;
  message?: string;
};

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<OrderActionResponse> {
  await requireStaff();

  if (!ORDER_STATUSES.includes(status)) {
    return { success: false, message: 'Estado inválido' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('orders').update({ status }).eq('id', id);

  if (error) {
    console.error('[orders] update status failed', error.message);
    return { success: false, message: 'Não foi possível atualizar o pedido.' };
  }

  revalidatePath('/admin/orders');
  return { success: true };
}

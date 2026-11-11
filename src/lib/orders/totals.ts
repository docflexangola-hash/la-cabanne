import type { StoredOrderItem } from './types';

export function getOrderTotal(items: StoredOrderItem[]): number {
  return items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
}

export function getOrderItemCount(items: StoredOrderItem[]): number {
  return items.reduce((count, item) => count + item.quantity, 0);
}

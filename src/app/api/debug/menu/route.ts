import { NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/public';

export async function GET() {
  try {
    const supabase = createPublicClient();
    
    const [groups, categories, products] = await Promise.all([
      supabase.from('menu_groups').select('*'),
      supabase.from('categories').select('*'),
      supabase.from('products').select('id, name, status, category_id'),
    ]);
    
    return NextResponse.json({
      groups: groups.data?.length || 0,
      categories: categories.data?.length || 0,
      products: products.data?.length || 0,
      productDetails: products.data,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

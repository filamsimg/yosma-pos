'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useCartStore } from '@/store/cart-store';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Plus,
  Minus,
  Package,
  Loader2,
  X,
} from 'lucide-react';
import type { Product, Category } from '@/types';
import { PRODUCT_PAGE_SIZE } from '@/lib/constants';

export function ProductCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { items: cartItems, addItem, removeItem, updateQuantity } = useCartStore();

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      const supabase = createClient();
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (data) setCategories(data);
    }
    fetchCategories();
  }, []);

  // Fetch products with pagination
  const fetchProducts = useCallback(
    async (pageNum: number, reset: boolean = false) => {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const supabase = createClient();
      let query = supabase
        .from('products')
        .select('*, category:categories(*)', { count: 'exact' })
        .eq('is_active', true)
        .order('name')
        .range(
          pageNum * PRODUCT_PAGE_SIZE,
          (pageNum + 1) * PRODUCT_PAGE_SIZE - 1
        );

      if (searchQuery.trim()) {
        query = query.ilike('name', `%${searchQuery.trim()}%`);
      }

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      const { data, count } = await query;

      if (data) {
        if (reset) {
          setProducts(data);
        } else {
          setProducts((prev) => [...prev, ...data]);
        }
        setHasMore(
          (count ?? 0) > (pageNum + 1) * PRODUCT_PAGE_SIZE
        );
      }

      setLoading(false);
      setLoadingMore(false);
    },
    [searchQuery, selectedCategory]
  );

  // Reset and fetch when search/category changes
  useEffect(() => {
    setPage(0);
    setProducts([]);
    setHasMore(true);
    fetchProducts(0, true);
  }, [fetchProducts]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchProducts(nextPage, false);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasMore, loadingMore, loading, page, fetchProducts]);

  // Get cart quantity for a product
  function getCartQuantity(productId: string): number {
    return cartItems.find((item) => item.product.id === productId)?.quantity ?? 0;
  }

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input
          placeholder="Cari produk..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9 bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-10"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Category Filter */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-blue-500 text-white'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-300'
            }`}
          >
            Semua
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() =>
                setSelectedCategory(
                  selectedCategory === cat.id ? null : cat.id
                )
              }
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/5 bg-white/5 p-3 space-y-2"
            >
              <Skeleton className="h-4 w-3/4 bg-white/10" />
              <Skeleton className="h-3 w-1/2 bg-white/10" />
              <Skeleton className="h-8 w-full bg-white/10" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
          <Package className="h-12 w-12 mb-3 opacity-50" />
          <p className="text-sm font-medium">Tidak ada produk ditemukan</p>
          <p className="text-xs mt-1">Coba ubah pencarian atau filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {products.map((product) => {
            const cartQty = getCartQuantity(product.id);
            const isOutOfStock = product.stock <= 0;

            return (
              <div
                key={product.id}
                className={`relative rounded-xl border p-3 transition-all ${
                  isOutOfStock
                    ? 'border-white/5 bg-white/[0.02] opacity-50'
                    : cartQty > 0
                    ? 'border-blue-500/30 bg-blue-500/5'
                    : 'border-white/5 bg-white/5 hover:bg-white/[0.08]'
                }`}
              >
                {/* Product Info */}
                <div className="mb-2">
                  <p className="text-sm font-medium text-white truncate">
                    {product.name}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    SKU: {product.sku}
                  </p>
                </div>

                {/* Price & Stock */}
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-blue-400">
                    Rp {product.price.toLocaleString('id-ID')}
                  </p>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] px-1.5 py-0 ${
                      isOutOfStock
                        ? 'bg-red-500/10 text-red-400'
                        : product.stock < 10
                        ? 'bg-yellow-500/10 text-yellow-400'
                        : 'bg-green-500/10 text-green-400'
                    }`}
                  >
                    {isOutOfStock ? 'Habis' : `Stok: ${product.stock}`}
                  </Badge>
                </div>

                {/* Add/Qty Controls */}
                {isOutOfStock ? (
                  <div className="h-8 flex items-center justify-center rounded-md bg-white/5 text-slate-600 text-xs">
                    Stok Habis
                  </div>
                ) : cartQty > 0 ? (
                  <div className="flex items-center justify-between h-8 rounded-md bg-white/5">
                    <button
                      onClick={() =>
                        updateQuantity(product.id, cartQty - 1)
                      }
                      className="flex items-center justify-center w-8 h-8 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-sm font-semibold text-white min-w-6 text-center">
                      {cartQty}
                    </span>
                    <button
                      onClick={() => addItem(product)}
                      disabled={cartQty >= product.stock}
                      className="flex items-center justify-center w-8 h-8 text-green-400 hover:text-green-300 transition-colors disabled:opacity-30"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => addItem(product)}
                    className="flex items-center justify-center gap-1 w-full h-8 rounded-md bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors text-xs font-medium"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Tambah
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Load More Trigger */}
      {hasMore && !loading && (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          {loadingMore && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Memuat produk...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

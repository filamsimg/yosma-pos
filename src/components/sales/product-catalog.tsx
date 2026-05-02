'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useCartStore } from '@/store/cart-store';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Plus,
  Minus,
  Package,
  Loader2,
  X,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import type { Product, Category } from '@/types';
import { useAuth } from '../providers/auth-provider';

export function ProductCatalog() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const { isOnline } = useAuth();
  const { items: cartItems, addItem, updateQuantity } = useCartStore();

  // Load from cache on mount
  useEffect(() => {
    const cachedProducts = localStorage.getItem('yosma_products_cache');
    const cachedCategories = localStorage.getItem('yosma_categories_cache');
    const cachedSyncTime = localStorage.getItem('yosma_last_sync');

    if (cachedProducts) setAllProducts(JSON.parse(cachedProducts));
    if (cachedCategories) setCategories(JSON.parse(cachedCategories));
    if (cachedSyncTime) setLastSync(new Date(cachedSyncTime));
    
    if (cachedProducts) setLoading(false);
  }, []);

  // Fetch all data once
  const fetchData = async () => {
    if (!navigator.onLine) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    
    try {
      const [pRes, cRes] = await Promise.all([
        supabase
          .from('products')
          .select('*, category:categories(*)')
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('categories')
          .select('*')
          .order('name')
      ]);

      if (pRes.error || cRes.error) throw pRes.error || cRes.error;

      if (pRes.data) {
        setAllProducts(pRes.data);
        localStorage.setItem('yosma_products_cache', JSON.stringify(pRes.data));
      }
      if (cRes.data) {
        setCategories(cRes.data);
        localStorage.setItem('yosma_categories_cache', JSON.stringify(cRes.data));
      }
      
      const now = new Date();
      setLastSync(now);
      localStorage.setItem('yosma_last_sync', now.toISOString());
    } catch (error: any) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Client-side filtering logic (Instant Search)
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      const matchesSearch = 
        !searchQuery.trim() || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = 
        !selectedCategory || 
        product.category_id === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [allProducts, searchQuery, selectedCategory]);

  function getCartQuantity(productId: string): number {
    return cartItems.find((item) => item.product.id === productId)?.quantity ?? 0;
  }

  return (
    <div className="space-y-4">
      {/* Top Header & Sync Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400">
          {!isOnline ? (
            <RefreshCw className="h-3 w-3 text-amber-500 animate-spin-slow" />
          ) : (
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
          )}
          <span>{!isOnline ? 'Data Terakhir (OFFLINE)' : 'Katalog Ter-SINKRON'}</span>
        </div>
        <button 
          onClick={fetchData} 
          disabled={loading || !isOnline}
          className="text-blue-600 hover:text-blue-700 disabled:opacity-30 transition-all active:rotate-180 duration-500"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </button>
      </div>

      {/* Search Bar - Premium Styled */}
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
        <Input
          placeholder="Cari produk di gudang..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10 bg-white border-slate-200 text-slate-900 h-12 shadow-sm focus-visible:ring-blue-600 transition-all rounded-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Category Filter - Premium Pills */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`shrink-0 px-4 py-2 rounded-sm text-xs font-bold transition-all shadow-sm border ${
              selectedCategory === null
                ? 'bg-blue-600 text-white border-blue-600 shadow-blue-100'
                : 'bg-white text-slate-500 border-slate-200 hover:border-blue-200 hover:text-blue-600'
            }`}
          >
            Semua
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              className={`shrink-0 px-4 py-2 rounded-sm text-xs font-bold transition-all shadow-sm border ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-blue-100'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-blue-200 hover:text-blue-600'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* Product Grid */}
      {loading && allProducts.length === 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-sm border border-slate-100 bg-white p-4 space-y-3 shadow-sm">
              <div className="w-10 h-10 rounded-sm bg-slate-50" />
              <div className="space-y-2">
                <div className="h-4 w-3/4 bg-slate-100 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-slate-50 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-sm border border-dashed border-slate-200">
          <div className="w-16 h-16 rounded-sm bg-white flex items-center justify-center mb-4 shadow-sm">
            <Package className="h-8 w-8 text-slate-200" />
          </div>
          <p className="text-sm font-bold text-slate-600 tracking-tight">Tidak ada produk ditemukan</p>
          <p className="text-xs text-slate-400 mt-1">Gunakan kata kunci atau kategori lain</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map((product) => {
            const cartQty = getCartQuantity(product.id);
            const isOutOfStock = product.stock <= 0;

            return (
              <div
                key={product.id}
                className={`relative rounded-sm border p-4 transition-all duration-300 ${
                  isOutOfStock
                    ? 'bg-slate-50 border-slate-100 opacity-60'
                    : cartQty > 0
                    ? 'bg-blue-50/50 border-blue-200 shadow-md shadow-blue-50/50 ring-1 ring-blue-500'
                    : 'bg-white border-slate-100 hover:border-blue-100 hover:shadow-lg hover:shadow-slate-100'
                }`}
              >
                {/* Product Info */}
                <div className="mb-3">
                  <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1 truncate">
                    {product.category?.name || 'UMUM'}
                  </div>
                  <p className="text-sm font-extrabold text-slate-900 line-clamp-2 leading-tight h-10">
                    {product.name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1 font-mono">
                    SKU: {product.sku}
                  </p>
                </div>

                {/* Price & Stock */}
                <div className="flex flex-col gap-1.5 mb-4">
                  <p className="text-base font-black text-blue-600">
                    Rp {product.price.toLocaleString('id-ID')}
                  </p>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] font-bold w-fit py-0 px-2 rounded-sm border-none ${
                      isOutOfStock
                        ? 'bg-red-50 text-red-600'
                        : product.stock < 10
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-emerald-50 text-emerald-600'
                    }`}
                  >
                    {isOutOfStock ? 'STOK HABIS' : `STOK: ${product.stock}`}
                  </Badge>
                </div>

                {/* Counter / Add Button */}
                {isOutOfStock ? (
                  <div className="h-10 flex items-center justify-center rounded-sm bg-slate-100 text-slate-400 text-xs font-bold border border-slate-200">
                    KOSONG
                  </div>
                ) : cartQty > 0 ? (
                  <div className="flex items-center justify-between h-10 rounded-sm bg-white border border-blue-200 shadow-sm overflow-hidden">
                    <button
                      onClick={() => updateQuantity(product.id, cartQty - 1)}
                      className="flex items-center justify-center w-10 h-10 text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-black text-slate-900">
                      {cartQty}
                    </span>
                    <button
                      onClick={() => addItem(product)}
                      disabled={cartQty >= product.stock}
                      className="flex items-center justify-center w-10 h-10 text-emerald-500 hover:bg-emerald-50 transition-colors disabled:opacity-30"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => addItem(product)}
                    className="flex items-center justify-center gap-2 w-full h-10 rounded-sm bg-blue-600 text-white hover:bg-blue-700 transition-all text-xs font-bold shadow-md shadow-blue-100 active:scale-95"
                  >
                    <Plus className="h-4 w-4" />
                    TAMBAH
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { create } from 'zustand';
import type { CartItem, Product, PaymentMethod } from '@/types';

interface CartStore {
  items: CartItem[];
  discount: number;
  paymentMethod: PaymentMethod;

  // Actions
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setDiscount: (discount: number) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  clearCart: () => void;

  // Computed
  getSubtotal: () => number;
  getTotalPrice: () => number;
  getTotalDiscount: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  discount: 0,
  paymentMethod: 'CASH',

  addItem: (product: Product) => {
    set((state) => {
      const existingItemIndex = state.items.findIndex(
        (item) => item.product.id === product.id
      );

      if (existingItemIndex > -1) {
        // Consolidation: If somehow duplicates exist, we update all of them or just the first one?
        // Standard practice: Update the first one and ensure no others exist.
        // But for safety here, let's just update the quantity of the existing one.
        const newItems = [...state.items];
        const existingItem = newItems[existingItemIndex];
        
        if (existingItem.quantity >= product.stock) return state;
        
        newItems[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + 1
        };

        return { items: newItems };
      }

      if (product.stock <= 0) return state;

      return {
        items: [
          ...state.items,
          {
            product,
            quantity: 1,
            price_at_sale: product.price,
          },
        ],
      };
    });
  },

  removeItem: (productId: string) => {
    set((state) => ({
      items: state.items.filter((item) => item.product.id !== productId),
    }));
  },

  updateQuantity: (productId: string, quantity: number) => {
    set((state) => {
      if (quantity <= 0) {
        return {
          items: state.items.filter((item) => item.product.id !== productId),
        };
      }

      return {
        items: state.items.map((item) => {
          if (item.product.id === productId) {
            // Don't exceed stock
            const validQuantity = Math.min(quantity, item.product.stock);
            return { ...item, quantity: validQuantity };
          }
          return item;
        }),
      };
    });
  },

  setDiscount: (discount: number) => {
    set({ discount: Math.max(0, discount) });
  },

  setPaymentMethod: (method: PaymentMethod) => {
    set({ paymentMethod: method });
  },

  clearCart: () => {
    set({ items: [], discount: 0, paymentMethod: 'CASH' });
  },

  getSubtotal: () => {
    return get().items.reduce(
      (total, item) => total + item.price_at_sale * item.quantity,
      0
    );
  },

  getTotalPrice: () => {
    const subtotal = get().getSubtotal();
    const totalDiscount = get().items.reduce(
      (total, item) => {
        const discountPercentage = item.product.discount_regular || 0;
        const discountAmount = (item.price_at_sale * (discountPercentage / 100)) * item.quantity;
        return total + discountAmount;
      },
      0
    );
    return Math.max(0, subtotal - totalDiscount);
  },

  getTotalDiscount: () => {
    return get().items.reduce(
      (total, item) => {
        const discountPercentage = item.product.discount_regular || 0;
        const discountAmount = (item.price_at_sale * (discountPercentage / 100)) * item.quantity;
        return total + discountAmount;
      },
      0
    );
  },

  getItemCount: () => {
    return get().items.reduce((count, item) => count + item.quantity, 0);
  },
}));

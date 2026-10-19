import useSWR from 'swr';
import { getCategories, getBrands, getUnits } from '@/lib/actions/products';
import { getOutletTypes } from '@/lib/actions/outlets';

export function useCategories() {
  const { data, error, isLoading, mutate } = useSWR(
    'master_categories',
    () => getCategories(),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );
  return { categories: data || [], isLoading, error, mutate };
}

export function useBrands() {
  const { data, error, isLoading, mutate } = useSWR(
    'master_brands',
    () => getBrands(),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );
  return { brands: data || [], isLoading, error, mutate };
}

export function useUnits() {
  const { data, error, isLoading, mutate } = useSWR(
    'master_units',
    () => getUnits(),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );
  return { units: data || [], isLoading, error, mutate };
}

export function useOutletTypes() {
  const { data, error, isLoading, mutate } = useSWR(
    'master_outlet_types',
    () => getOutletTypes(),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );
  return { outletTypes: data || [], isLoading, error, mutate };
}

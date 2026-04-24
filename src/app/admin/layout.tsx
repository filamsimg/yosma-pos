import { AdminLayoutClient } from '@/components/admin/layout/AdminLayoutClient';

const navItems = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/transactions', label: 'Transaksi', exact: false },
  { href: '/admin/products', label: 'Produk', exact: false },
  { href: '/admin/outlets', label: 'Outlet', exact: false },
  { href: '/admin/map', label: 'Peta', exact: false },
  { href: '/admin/profiles', label: 'Karyawan', exact: false },
  { href: '/admin/receivables', label: 'Piutang', exact: false },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminLayoutClient navItems={navItems}>
      {children}
    </AdminLayoutClient>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Store,
  MapPin,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Outlet } from '@/types';

export default function AdminOutletsPage() {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form state
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from('outlets').select('*').eq('is_active', true).order('name');
    if (data) setOutlets(data);
    setLoading(false);
  }

  function handleOpenModal(outlet?: Outlet) {
    if (outlet) {
      setSelectedOutlet(outlet);
      setFormData({
        name: outlet.name,
        address: outlet.address || '',
        phone: outlet.phone || '',
      });
    } else {
      setSelectedOutlet(null);
      setFormData({
        name: '',
        address: '',
        phone: '',
      });
    }
    setModalOpen(true);
  }

  async function handleSaveOutlet() {
    if (!formData.name) {
      toast.error('Nama outlet wajib diisi');
      return;
    }

    setActionLoading(true);
    const supabase = createClient();
    const payload = {
      name: formData.name,
      address: formData.address || null,
      phone: formData.phone || null,
    };

    try {
      if (selectedOutlet) {
        // Update
        const { error } = await supabase
          .from('outlets')
          .update(payload)
          .eq('id', selectedOutlet.id);
        if (error) throw error;
        toast.success('Outlet berhasil diperbarui');
      } else {
        // Insert
        const { error } = await supabase
          .from('outlets')
          .insert(payload);
        if (error) throw error;
        toast.success('Outlet berhasil ditambahkan');
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error('Gagal menyimpan outlet', { description: err.message });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteOutlet(id: string) {
    if (!confirm('Apakah Anda yakin ingin menghapus outlet ini?')) return;
    
    const supabase = createClient();
    const { error } = await supabase
      .from('outlets')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      toast.error('Gagal menghapus outlet');
    } else {
      toast.success('Outlet dihapus');
      setOutlets(outlets.filter(p => p.id !== id));
    }
  }

  const filteredOutlets = outlets.filter(
    (o) =>
      !searchQuery.trim() ||
      o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Daftar Outlet</h1>
          <p className="text-sm text-slate-400 mt-1">
            Kelola cabang dan lokasi outlet ({outlets.length} total)
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Cari nama atau alamat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-9"
            />
          </div>
          <Button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-500 text-white h-9"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Outlet Baru
          </Button>
        </div>
      </div>

      {/* Outlets List */}
      <Card className="border-white/5 bg-white/[0.03]">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-slate-400 w-[50px] text-center"><Store className="h-4 w-4 mx-auto" /></TableHead>
                <TableHead className="text-slate-400">Nama Outlet</TableHead>
                <TableHead className="text-slate-400">Alamat</TableHead>
                <TableHead className="text-slate-400">No. Telepon</TableHead>
                <TableHead className="text-slate-400 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-white/5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full bg-white/10" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredOutlets.length === 0 ? (
                <TableRow className="border-white/5">
                  <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                    Tidak ada outlet ditemukan
                  </TableCell>
                </TableRow>
              ) : (
                filteredOutlets.map((o) => (
                  <TableRow key={o.id} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell className="text-center">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto">
                        <Store className="h-4 w-4 text-blue-400" />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-white text-sm">{o.name}</TableCell>
                    <TableCell className="text-slate-300 text-sm max-w-[200px] truncate">
                      {o.address ? (
                        <div className="flex items-center gap-1" title={o.address}>
                          <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                          <span className="truncate">{o.address}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-300 text-sm">{o.phone || '-'}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenModal(o)}
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 h-8 px-2"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteOutlet(o.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10 h-8 px-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Outlet Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent showCloseButton={true} className="max-w-md bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">
              {selectedOutlet ? 'Edit Outlet' : 'Outlet Baru'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Isi detail outlet untuk keperluan check-in sales
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-slate-300">Nama Outlet *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Toko Budi Jaya"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address" className="text-slate-300">Alamat Lengkap</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Jl. Merdeka No. 123"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone" className="text-slate-300">No. Telepon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="0812xxxxxx"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="bg-transparent border-white/10 text-slate-300 hover:bg-white/5"
            >
              Batal
            </Button>
            <Button
              onClick={handleSaveOutlet}
              disabled={actionLoading}
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

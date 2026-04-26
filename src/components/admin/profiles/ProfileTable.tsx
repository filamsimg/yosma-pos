"use client"

import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, UserCog, Phone, User, UserCheck, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import type { Profile } from '@/types';
import { AdminTable } from '@/components/ui/admin/data-table';
import { cn } from '@/lib/utils';

interface ProfileTableProps {
  profiles: Profile[];
  loading: boolean;
  onEdit: (profile: Profile) => void;
  sorting: { field: string; dir: 'asc' | 'desc' };
  onSort: (field: string) => void;
}

export function ProfileTable({ 
  profiles, 
  loading, 
  onEdit,
  sorting,
  onSort,
}: ProfileTableProps) {
  if (loading) {
    return (
      <div className="p-12 text-center opacity-30">
        <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Memuat data profil...</p>
      </div>
    );
  }

  const headers = [
    <div key="name" className="flex items-center justify-center gap-2 cursor-pointer" onClick={() => onSort('full_name')}>
      Karyawan
      {sorting.field === 'full_name' ? (
        sorting.dir === 'asc' ? <ArrowUp className="h-3 w-3 text-blue-600" /> : <ArrowDown className="h-3 w-3 text-blue-600" />
      ) : (
        <ArrowUpDown className="h-3 w-3 text-slate-600 opacity-90" />
      )}
    </div>,
    <div className="text-center">Role / Akses</div>,
    <div className="text-center">Kontak</div>,
    <div className="text-center">Status</div>,
    <div key="actions" className="text-center">Aksi</div>,
  ];

  return (
    <AdminTable headers={headers}>
      {profiles.map((profile) => (
        <TableRow key={profile.id} className="hover:bg-slate-50/50 transition-colors group border-b border-slate-50">
          <TableCell className="py-3 px-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-9 h-9 rounded-sm flex items-center justify-center font-black text-[14px] text-white shadow-sm transition-transform group-hover:scale-105",
                profile.role === 'ADMIN' ? 'bg-indigo-600' : 'bg-blue-600'
              )}>
                {profile.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-black text-slate-900 text-xs uppercase tracking-tight truncate group-hover:text-blue-600 transition-colors">
                  {profile.full_name}
                </div>
                {profile.nik && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] font-black text-blue-600 font-mono bg-blue-50 px-1.5 py-0.5 rounded-sm border border-blue-100 uppercase tracking-tighter">
                      {profile.nik}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </TableCell>
          
          <TableCell className="py-3 px-4">
            <div className="flex items-center">
              {profile.role === 'ADMIN' ? (
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 font-black text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-sm">
                  <UserCog className="h-3 w-3 mr-1.5" /> ADMIN
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 font-black text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-sm">
                  <UserCheck className="h-3 w-3 mr-1.5" /> SALES
                </Badge>
              )}
            </div>
          </TableCell>

          <TableCell className="py-3 px-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-sm bg-slate-50 border border-slate-100 flex items-center justify-center">
                <Phone className="h-3.5 w-3.5 text-slate-600" />
              </div>
              <span className="text-[11px] font-bold text-slate-600 font-mono">
                {profile.phone || '-'}
              </span>
            </div>
          </TableCell>

          <TableCell className="py-3 px-4">
            {profile.is_active ? (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-black text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-sm flex items-center w-fit">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                AKTIF
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 font-black text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-sm flex items-center w-fit">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-600 mr-1.5" />
                NONAKTIF
              </Badge>
            )}
          </TableCell>

          <TableCell className="py-3 px-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onEdit(profile)}
                className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-all rounded-sm border border-transparent hover:border-blue-100 shadow-sm hover:shadow-md"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      ))}
      {profiles.length === 0 && !loading && (
        <TableRow>
          <TableCell colSpan={5} className="py-20 text-center opacity-60">
            <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
              <User className="h-10 w-10" />
              <p className="text-[10px] font-black uppercase tracking-widest">Belum ada data karyawan</p>
            </div>
          </TableCell>
        </TableRow>
      )}
    </AdminTable>
  );
}

'use client';

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, UserCog, Mail, Phone, ArrowUpDown, ArrowUp, ArrowDown, User, Briefcase, UserCheck } from 'lucide-react';
import type { Profile } from '@/types';

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
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-sm font-medium">Memuat data profil...</p>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200 m-6">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
          <User className="h-8 w-8 text-slate-300" />
        </div>
        <p className="font-bold text-slate-600">Tidak ada profil ditemukan</p>
        <p className="text-sm mt-1">Belum ada data karyawan atau pencarian tidak cocok.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 border-b border-slate-100 hover:bg-slate-50">
            <TableHead 
              className="font-semibold text-slate-500 text-xs px-6 py-3 cursor-pointer hover:bg-slate-100 transition-colors"
              onClick={() => onSort('full_name')}
            >
              <div className="flex items-center">
                KARYAWAN
                {sorting.field === 'full_name' ? (
                  sorting.dir === 'asc' ? <ArrowUp className="ml-2 h-3.5 w-3.5 text-blue-600" /> : <ArrowDown className="ml-2 h-3.5 w-3.5 text-blue-600" />
                ) : (
                  <ArrowUpDown className="ml-2 h-3.5 w-3.5 opacity-30" />
                )}
              </div>
            </TableHead>
            <TableHead className="font-semibold text-slate-500 text-xs py-3">
                ROLE / AKSES
            </TableHead>
            <TableHead className="font-semibold text-slate-500 text-xs py-3">KONTAK</TableHead>
            <TableHead className="font-semibold text-slate-500 text-xs py-3">
                STATUS
            </TableHead>
            <TableHead className="font-semibold text-slate-500 text-xs text-center px-6 py-3">AKSI</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.map((profile) => (
            <TableRow key={profile.id} className="hover:bg-slate-50/80 transition-colors group">
              <TableCell className="py-4 px-6">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${profile.role === 'ADMIN' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                    {profile.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {profile.full_name}
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                      {profile.nik && (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">NIK:</span>
                          <span className="text-[10px] font-black text-blue-600 font-mono bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                            {profile.nik}
                          </span>
                        </div>
                      )}
                      {profile.npwp && (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">NPWP:</span>
                          <span className="text-[10px] font-medium text-slate-600 font-mono">
                            {profile.npwp}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TableCell>
              
              <TableCell className="py-4">
                <div className="flex items-center gap-2">
                  {profile.role === 'ADMIN' ? (
                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-bold flex items-center gap-1">
                      <UserCog className="h-3 w-3" /> ADMIN
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold flex items-center gap-1">
                      <UserCheck className="h-3 w-3" /> SALES
                    </Badge>
                  )}
                </div>
              </TableCell>

              <TableCell className="py-4">
                <div className="space-y-1.5">
                  {profile.phone ? (
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      {profile.phone}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Target kontak kosong</span>
                  )}
                </div>
              </TableCell>

              <TableCell className="py-4">
                {profile.is_active ? (
                  <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    AKTIF
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                    <div className="w-2 h-2 rounded-full bg-slate-300" />
                    NONAKTIF
                  </div>
                )}
              </TableCell>

              <TableCell className="py-4 text-center px-6">
                <div className="flex items-center justify-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onEdit(profile)}
                    className="h-8 shadow-sm border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 font-medium transition-all"
                  >
                    <Edit className="h-3.5 w-3.5 mr-2" />
                    Edit
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

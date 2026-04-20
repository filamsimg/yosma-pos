'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ExportButtonProps {
  fetcher: () => Promise<{ data?: any[]; error?: string }>;
  filename: string;
  mapper: (item: any) => Record<string, any>;
  label?: string;
  variant?: "outline" | "default" | "destructive" | "secondary" | "ghost" | "link";
  className?: string;
}

export function ExportButton({ 
  fetcher, 
  filename, 
  mapper, 
  label = "Export Excel",
  variant = "outline",
  className = ""
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const { data, error } = await fetcher();
      
      if (error) {
        toast.error("Gagal mengambil data untuk export", { description: error });
        return;
      }

      if (!data || data.length === 0) {
        toast.error("Tidak ada data yang tersedia untuk di-export");
        return;
      }

      // Map data to headers
      const exportData = data.map(mapper);

      // Generate worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');

      // Download file
      const fullFilename = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fullFilename);
      
      toast.success("Data berhasil di-export");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Terjadi kesalahan saat mengunduh file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant={variant} 
      onClick={handleExport} 
      disabled={loading}
      className={`border-slate-200 text-slate-600 hover:bg-slate-50 gap-2 h-10 px-4 ${className}`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> : <FileDown className="h-4 w-4 text-blue-600" />}
      <span>{loading ? "Memproses..." : label}</span>
    </Button>
  );
}

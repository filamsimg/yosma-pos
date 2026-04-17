'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileDown, FileUp, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { bulkImportProducts, type ProductImportItem } from '@/lib/actions/import';
import { toast } from 'sonner';

interface ImportDialogProps {
  onSuccess: () => void;
}

export function ImportDialog({ onSuccess }: ImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ProductImportItem[]>([]);
  const [ fileName, setFileName ] = useState<string>('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];

      // Map headers to internal keys (Case-insensitive matching)
      const mappedData: ProductImportItem[] = data.map((row) => ({
        nama: row['Nama'] || row['nama'] || '',
        sku: row['SKU'] || row['sku'] || '',
        merk: row['Merk'] || row['merk'] || '',
        kategori: row['Kategori'] || row['kategori'] || '',
        satuan: row['Satuan'] || row['satuan'] || '',
        harga: Number(row['Harga'] || row['harga'] || 0),
        stok: Number(row['Stok'] || row['stok'] || row['Stok Awal'] || 0),
        deskripsi: row['Deskripsi'] || row['deskripsi'] || '',
        diskon_reguler: Number(row['Diskon'] || row['diskon'] || 0),
      })).filter(item => item.nama); // Allow empty SKU for auto-generation

      setPreview(mappedData);
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (preview.length === 0) return;

    setLoading(true);
    try {
      const result = await bulkImportProducts(preview);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Berhasil mengimport ${result.count} produk`);
        setOpen(false);
        setPreview([]);
        setFileName('');
        onSuccess();
      }
    } catch (err) {
      toast.error('Gagal memproses data');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        'Nama': 'CONTOH PRODUK A',
        'SKU': 'SKU-001',
        'Merk': 'YOSMA',
        'Kategori': 'MAKANAN',
        'Satuan': 'PCS',
        'Harga': 15000,
        'Stok': 100,
        'Deskripsi': 'Deskripsi produk'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'Template_Import_Produk.xlsx');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50 gap-2 h-10 px-4">
            <FileUp className="h-4 w-4" />
            Import Excel
          </Button>
        }
      />
      <DialogContent className="max-w-2xl bg-white border-slate-200 p-6 flex flex-col gap-6 rounded-xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">Import Produk Massal</DialogTitle>
          <DialogDescription className="text-slate-500">
            Unggah file Excel untuk menambahkan banyak barang sekaligus ke katalog Anda.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-8 bg-slate-50/50 hover:bg-slate-50 transition-all group relative cursor-pointer">
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleFileUpload}
            />
            {fileName ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
                <span className="font-semibold text-slate-900">{fileName}</span>
                <span className="text-xs text-slate-500">{preview.length} baris data terdeteksi</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <FileUp className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-900 text-sm">Klik atau seret file ke sini</p>
                  <p className="text-xs text-slate-500 mt-1">Hanya mendukung .xlsx, .xls, atau .csv</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center shadow-sm">
                <FileDown className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-900">Belum punya formatnya?</p>
                <p className="text-xs text-blue-700">Gunakan template resmi kami agar data terbaca sempurna.</p>
              </div>
            </div>
            <Button 
              size="sm" 
              onClick={downloadTemplate}
              className="bg-white hover:bg-slate-50 text-blue-600 border border-blue-200 font-semibold shadow-sm"
            >
              Ambil Template
            </Button>
          </div>
        </div>

        {preview.length > 0 && (
          <div className="border border-slate-200 rounded-lg max-h-[200px] overflow-auto shadow-inner">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2">Nama</th>
                  <th className="px-3 py-2">SKU</th>
                  <th className="px-3 py-2">Merk</th>
                  <th className="px-3 py-2">Harga</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {preview.slice(0, 10).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-3 py-2 text-slate-900">{row.nama}</td>
                    <td className="px-3 py-2 text-slate-600 font-mono">
                      {row.sku || <span className="text-[10px] text-blue-500 font-sans italic">Otomatis</span>}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{row.merk}</td>
                    <td className="px-3 py-2 font-semibold text-blue-600">Rp {row.harga.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 10 && (
              <p className="p-2 text-[10px] text-center text-slate-400 bg-slate-50/30">
                Menampilkan 10 dari {preview.length} produk...
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="border-slate-200 text-slate-600 hover:bg-slate-50 px-6"
          >
            Batal
          </Button>
          <Button
            onClick={handleImport}
            disabled={loading || preview.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 shadow-md shadow-blue-100 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileUp className="h-4 w-4 mr-2" />}
            Mulai Import Massal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

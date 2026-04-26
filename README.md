# 🚀 YOSMA POS - Advanced Sales & Distribution Management

**YOSMA POS** adalah platform manajemen penjualan dan distribusi modern yang dirancang khusus untuk efisiensi operasional lapangan. Dibangun dengan teknologi mutakhir, sistem ini menawarkan pengalaman pengguna yang premium, responsif, dan sangat fleksibel.

---

## ✨ Fitur Unggulan

### 🏥 Manajemen Outlet Canggih
- **Jadwal Kunjungan Fleksibel**: Mendukung jadwal kunjungan multi-hari (contoh: Selasa & Jumat) untuk satu outlet.
- **Multi-Sales Assignment**: Satu outlet dapat ditugaskan ke beberapa sales sekaligus (mendukung transisi sales tetap ke freelance).
- **Visual Schedule Badges**: Indikator jadwal kunjungan berwarna untuk kemudahan monitoring.
- **Filter Wilayah**: Pengelompokan dan pencarian outlet berdasarkan Kota dan Tipe Outlet.

### 📦 Inventaris & Produk
- **Manajemen Katalog**: Pengelolaan produk lengkap dengan SKU, Merk, Kategori, dan Satuan.
- **Low Stock Alerts**: Notifikasi visual untuk stok produk yang berada di bawah ambang batas minimum.
- **Premium UI**: Tampilan produk yang bersih dengan kontras tinggi untuk memudahkan Admin.

### 📊 Dashboard & Analitik
- **Real-time Statistics**: Pantau total outlet, produk aktif, dan aktivitas sales secara langsung.
- **Role-Based Access**: Pemisahan akses yang ketat antara Admin (Manajemen) dan Sales (Lapangan).

### ⚡ Smart Bulk Operations
- **Excel Mass Import**: Impor ribuan data produk dan outlet sekaligus.
- **Auto-Normalization**: Sistem cerdas yang otomatis merapikan format nomor telepon, hari, dan tipe data dari Excel.

---

## 🛠️ Teknologi yang Digunakan

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **Backend/Database**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage)
- **State Management**: React Hooks & Server Actions
- **File Processing**: XLSX (Excel Integration)

---

## 🚀 Panduan Instalasi Cepat

### 1. Clone Repositori
```bash
git clone https://github.com/filamsimg/yosma-pos.git
cd yosma-pos
```

### 2. Instal Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment
Salin file `.env.local.example` menjadi `.env.local` dan lengkapi kredensial Supabase Anda:
```bash
cp .env.local.example .env.local
```

Jangan lupa untuk mengatur **Kode Akses Registrasi**:
```env
ADMIN_INVITE_CODE=YOSMA-ADMIN-2026
SALES_INVITE_CODE=YOSMA-SALES-2026
```

### 4. Jalankan Server Development
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 🔒 Keamanan & Akses
Aplikasi ini menggunakan sistem **Invite-Only Registration**. Pengguna baru harus memiliki kode akses yang valid dari Administrator untuk dapat mendaftar sebagai Sales maupun Admin.

---

## 📝 Lisensi
Distribusi Terbatas - Milik **YOSMA Distribution**.

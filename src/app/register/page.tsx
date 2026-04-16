'use client';

import { useState } from 'react';
import Link from 'next/link';
import { register } from '@/lib/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ShoppingCart,
  Eye,
  EyeOff,
  UserPlus,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Shield,
  Briefcase,
} from 'lucide-react';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState('SALES');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    formData.set('role', selectedRole);

    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirm_password') as string;

    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok.');
      setLoading(false);
      return;
    }

    const result = await register(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.success) {
      setSuccess(result.message || 'Registrasi berhasil! Silakan cek email Anda untuk konfirmasi.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100">

      <div className="relative z-10 w-full max-w-md px-4 py-8">
        {/* Back to Login */}
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-sm mb-6 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Kembali ke Login
        </Link>

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25 mb-4">
            <ShoppingCart className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Buat Akun <span className="text-indigo-600">Baru</span>
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Daftar untuk mengakses YOSMA POS
          </p>
        </div>

        {/* Register Card */}
        <Card className="border-slate-200 bg-white shadow-md">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-slate-900 text-center">
              Registrasi
            </CardTitle>
            <CardDescription className="text-slate-500 text-center">
              Lengkapi data untuk membuat akun
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success ? (
              <div className="py-6 space-y-4">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-500/10">
                    <AlertCircle className="h-7 w-7 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-300">{success}</p>
                    <p className="text-xs text-slate-500 mt-1">Cek folder inbox atau spam di email Anda</p>
                  </div>
                </div>
                <Link href="/login">
                  <Button
                    variant="outline"
                    className="w-full h-11 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-all duration-300"
                  >
                    Kembali ke Login
                  </Button>
                </Link>
              </div>
            ) : (

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-slate-700 text-sm">
                  Nama Lengkap
                </Label>
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  placeholder="John Doe"
                  required
                  autoComplete="name"
                  className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20 h-11"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 text-sm">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="nama@perusahaan.com"
                  required
                  autoComplete="email"
                  className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20 h-11"
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label className="text-slate-700 text-sm">Peran / Role</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('SALES')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-300 ${
                      selectedRole === 'SALES'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Briefcase
                      className={`h-6 w-6 ${selectedRole === 'SALES' ? 'text-indigo-600' : ''}`}
                    />
                    <div className="text-center">
                      <p className="text-sm font-medium">Sales</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tim Lapangan
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('ADMIN')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-300 ${
                      selectedRole === 'ADMIN'
                        ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Shield
                      className={`h-6 w-6 ${selectedRole === 'ADMIN' ? 'text-purple-600' : ''}`}
                    />
                    <div className="text-center">
                      <p className="text-sm font-medium">Admin</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Manajemen
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 text-sm">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimal 6 karakter"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20 h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label
                  htmlFor="confirm_password"
                  className="text-slate-700 text-sm"
                >
                  Konfirmasi Password
                </Label>
                <Input
                  id="confirm_password"
                  name="confirm_password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ulangi password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20 h-11"
                />
              </div>

              {/* Invite Code */}
              <div className="space-y-2">
                <Label
                  htmlFor="invite_code"
                  className="text-slate-700 text-sm"
                >
                  Kode Akses {selectedRole === 'ADMIN' ? 'Admin' : 'Sales'}
                </Label>
                <div className="relative">
                  <Input
                    id="invite_code"
                    name="invite_code"
                    type="password"
                    placeholder={`Masukkan kode verifikasi ${selectedRole.toLowerCase()}`}
                    required
                    className={`bg-white border-slate-200 placeholder:text-slate-400 h-11 pr-10 ${
                      selectedRole === 'ADMIN' ? 'focus:border-purple-500 focus:ring-purple-500/20 text-purple-900' : 'focus:border-indigo-500 focus:ring-indigo-500/20 text-indigo-900'
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {selectedRole === 'ADMIN' ? <Shield className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
                  </div>
                </div>
                <p className="text-[10.5px] text-slate-500">Dapatkan kode akses ini dari sistem administrator.</p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Buat Akun
                  </>
                )}
              </Button>
            </form>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-6">
          Dengan mendaftar, Anda menyetujui ketentuan penggunaan kami.
        </p>
      </div>
    </div>
  );
}

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
  const [selectedRole, setSelectedRole] = useState('SALES');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl animate-pulse [animation-delay:1s]" />
        <div className="absolute top-1/3 right-1/4 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl animate-pulse [animation-delay:2s]" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 w-full max-w-md px-4 py-8">
        {/* Back to Login */}
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm mb-6 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Kembali ke Login
        </Link>

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25 mb-4">
            <ShoppingCart className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Buat Akun <span className="text-indigo-400">Baru</span>
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Daftar untuk mengakses YOSMA POS
          </p>
        </div>

        {/* Register Card */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/20">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-white text-center">
              Registrasi
            </CardTitle>
            <CardDescription className="text-slate-400 text-center">
              Lengkapi data untuk membuat akun
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-slate-300 text-sm">
                  Nama Lengkap
                </Label>
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  placeholder="John Doe"
                  required
                  autoComplete="name"
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20 h-11"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300 text-sm">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="nama@perusahaan.com"
                  required
                  autoComplete="email"
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20 h-11"
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">Peran / Role</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('SALES')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-300 ${
                      selectedRole === 'SALES'
                        ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-lg shadow-indigo-500/10'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <Briefcase
                      className={`h-6 w-6 ${selectedRole === 'SALES' ? 'text-indigo-400' : ''}`}
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
                        ? 'border-purple-500 bg-purple-500/10 text-white shadow-lg shadow-purple-500/10'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <Shield
                      className={`h-6 w-6 ${selectedRole === 'ADMIN' ? 'text-purple-400' : ''}`}
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
                <Label htmlFor="password" className="text-slate-300 text-sm">
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
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20 h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
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
                  className="text-slate-300 text-sm"
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
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20 h-11"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:shadow-indigo-500/30 hover:scale-[1.01] active:scale-[0.99] mt-2"
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

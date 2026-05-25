'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await authApi.login(form);
      setAuth(data.user, data.token);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Email ou senha incorretos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <img src="/atlas-logo-dark.png" alt="Atlas — Inteligência Imobiliária" className="h-28 w-auto mx-auto" />
          </Link>
        </div>

        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl shadow-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-1">Entrar na plataforma</h1>
          <p className="text-white/40 text-sm mb-6">Acesse seu painel de investimentos</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full bg-white/5 border border-white/15 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-white/25"
                placeholder="seu@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Senha</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full bg-white/5 border border-white/15 text-white rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-white/25"
                  placeholder="Sua senha"
                  required
                />
                <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-2.5 text-white/30 hover:text-white/60">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-500 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors mt-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-sm text-white/40 mt-6">
            Não tem conta?{' '}
            <Link href="/register" className="text-blue-400 font-medium hover:text-blue-300">Cadastrar gratuitamente</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

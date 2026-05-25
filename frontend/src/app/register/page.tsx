'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await authApi.register(form);
      setAuth(data.user, data.token);
      router.push('/onboarding');
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { error?: string; errors?: Array<{ msg: string }> } } };
      const msg = apiError?.response?.data?.error ||
        apiError?.response?.data?.errors?.[0]?.msg;
      setError(msg || 'Erro ao criar conta');
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
          <h1 className="text-2xl font-bold text-white mb-1">Criar sua conta</h1>
          <p className="text-white/40 text-sm mb-6">Comece a investir com inteligência artificial</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Nome completo', key: 'name', type: 'text', placeholder: 'Seu nome' },
              { label: 'Email', key: 'email', type: 'email', placeholder: 'seu@email.com' },
              { label: 'Senha (mín. 8 caracteres)', key: 'password', type: 'password', placeholder: '••••••••' },
              { label: 'WhatsApp (opcional)', key: 'phone', type: 'tel', placeholder: '+55 11 99999-9999' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-white/70 mb-1">{field.label}</label>
                <input
                  type={field.type}
                  value={form[field.key as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  className="w-full bg-white/5 border border-white/15 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-white/25"
                  placeholder={field.placeholder}
                  required={field.key !== 'phone'}
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-500 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors mt-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Criando conta...' : 'Criar Conta Grátis'}
            </button>
          </form>

          <p className="text-center text-sm text-white/40 mt-6">
            Já tem conta?{' '}
            <Link href="/login" className="text-blue-400 font-medium hover:text-blue-300">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

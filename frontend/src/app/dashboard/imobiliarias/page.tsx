'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Building2, Search, Plus, Globe, Phone, MapPin, Tag, X, ChevronDown
} from 'lucide-react';

interface Agency {
  id: string;
  name: string;
  city: string;
  state: string;
  phone?: string;
  email?: string;
  website?: string;
  creci?: string;
  specialty: string;
  type: string;
}

const TYPE_COLORS: Record<string, string> = {
  Franquia: 'bg-blue-100 text-blue-700',
  Regional: 'bg-purple-100 text-purple-700',
  Digital: 'bg-green-100 text-green-700',
  Independente: 'bg-gray-100 text-gray-700',
};

const STATES_BR = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA',
  'MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN',
  'RO','RR','RS','SC','SE','SP','TO',
];

const SPECIALTIES = [
  'Residencial','Comercial','Lançamentos','Litorâneos','Alto Padrão',
  'Rural','Locação','Residencial e Comercial','Turísticos',
];

const TYPES = ['Franquia','Regional','Digital','Independente'];

function AddAgencyModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: '', city: '', state: 'SP', phone: '', email: '',
    website: '', creci: '', specialty: 'Residencial', type: 'Independente',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/agencies', form);
      qc.invalidateQueries({ queryKey: ['agencies'] });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, key: keyof typeof form, type = 'text') => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900">Nova Imobiliária</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">{field('Nome da Imobiliária *', 'name')}</div>
            {field('Cidade *', 'city')}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Estado *</label>
              <select
                value={form.state}
                onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATES_BR.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            {field('Telefone', 'phone', 'tel')}
            {field('Email', 'email', 'email')}
            <div className="col-span-2">{field('Website', 'website', 'url')}</div>
            {field('CRECI', 'creci')}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Especialidade</label>
              <select
                value={form.specialty}
                onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving || !form.name || !form.city}
              className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
              {saving ? 'Salvando...' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ImobiliariasPage() {
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const qc = useQueryClient();
  const LIMIT = 48;

  const params: Record<string, string> = { page: String(page), limit: String(LIMIT) };
  if (search) params.search = search;
  if (stateFilter) params.state = stateFilter;
  if (typeFilter) params.type = typeFilter;
  if (specialtyFilter) params.specialty = specialtyFilter;

  const { data, isLoading } = useQuery({
    queryKey: ['agencies', params],
    queryFn: () => api.get('/agencies', { params }).then(r => r.data),
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/agencies/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agencies'] }),
  });

  const agencies: Agency[] = data?.data || [];
  const total: number = data?.total || 0;
  const totalPages = Math.ceil(total / LIMIT);

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };
  const handleFilter = (key: string, v: string) => {
    if (key === 'state') setStateFilter(v);
    if (key === 'type') setTypeFilter(v);
    if (key === 'specialty') setSpecialtyFilter(v);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch(''); setStateFilter(''); setTypeFilter(''); setSpecialtyFilter(''); setPage(1);
  };

  const hasFilters = search || stateFilter || typeFilter || specialtyFilter;

  return (
    <div className="space-y-5">
      {showModal && <AddAgencyModal onClose={() => setShowModal(false)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Base de Imobiliárias</h2>
          <p className="text-sm text-gray-500">{total.toLocaleString()} imobiliárias cadastradas no Brasil</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Cadastrar
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border p-4 space-y-3">
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Buscar por nome ou cidade..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            <select
              value={stateFilter}
              onChange={e => handleFilter('state', e.target.value)}
              className="appearance-none border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Todos os estados</option>
              {STATES_BR.map(s => <option key={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={typeFilter}
              onChange={e => handleFilter('type', e.target.value)}
              className="appearance-none border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Todos os tipos</option>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={specialtyFilter}
              onChange={e => handleFilter('specialty', e.target.value)}
              className="appearance-none border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Todas especialidades</option>
              {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 px-2">
              <X className="h-4 w-4" /> Limpar
            </button>
          )}

          <div className="flex border border-gray-300 rounded-lg overflow-hidden ml-auto">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-2 text-sm ${viewMode === 'cards' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Tabela
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Carregando...</div>
      ) : agencies.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <Building2 className="h-10 w-10 mb-2 opacity-30" />
          <p className="text-sm">Nenhuma imobiliária encontrada</p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {agencies.map(agency => (
            <div key={agency.id} className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{agency.name}</h3>
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{agency.city}, {agency.state}</span>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${TYPE_COLORS[agency.type] || TYPE_COLORS.Independente}`}>
                  {agency.type}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Tag className="h-3 w-3 text-gray-400 flex-shrink-0" />
                <span className="truncate">{agency.specialty}</span>
              </div>

              {agency.phone && (
                <a href={`tel:${agency.phone}`} className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-blue-600">
                  <Phone className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  <span>{agency.phone}</span>
                </a>
              )}

              {agency.website && (
                <a href={agency.website} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline truncate">
                  <Globe className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{agency.website.replace(/^https?:\/\//, '')}</span>
                </a>
              )}

              {agency.creci && (
                <div className="text-xs text-gray-400">CRECI: {agency.creci}</div>
              )}

              <button
                onClick={() => deleteMutation.mutate(agency.id)}
                className="text-xs text-red-400 hover:text-red-600 text-left mt-auto"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nome</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Cidade</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Especialidade</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Telefone</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Site</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {agencies.map(agency => (
                  <tr key={agency.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{agency.name}</td>
                    <td className="px-4 py-3 text-gray-600">{agency.city}</td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-0.5 rounded">{agency.state}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[agency.type] || TYPE_COLORS.Independente}`}>
                        {agency.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{agency.specialty}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {agency.phone && <a href={`tel:${agency.phone}`} className="hover:text-blue-600">{agency.phone}</a>}
                    </td>
                    <td className="px-4 py-3">
                      {agency.website && (
                        <a href={agency.website} target="_blank" rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs">
                          {agency.website.replace(/^https?:\/\//, '').split('/')[0]}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => deleteMutation.mutate(agency.id)}
                        className="text-xs text-red-400 hover:text-red-600">Remover</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Mostrando {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} de {total.toLocaleString()}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
            >
              Anterior
            </button>
            <span className="px-3 py-1.5 text-sm text-gray-600">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

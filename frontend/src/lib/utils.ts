import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export const TAG_CONFIG = {
  STRONG_DEAL: { label: 'EXCELENTE OPORTUNIDADE', color: 'bg-green-100 text-green-700 border-green-200', shortLabel: 'Excelente' },
  MARGINAL: { label: 'OPORTUNIDADE MODERADA', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', shortLabel: 'Moderada' },
  AVOID: { label: 'NÃO RECOMENDADO', color: 'bg-red-100 text-red-700 border-red-200', shortLabel: 'Não Rec.' },
} as const;

export const SOURCE_LABELS: Record<string, string> = {
  ZAPIMOVEIS: 'ZAP Imóveis',
  VIVAREAL: 'VivaReal',
  OLX: 'OLX',
  IMOVELWEB: 'Imovelweb',
};

export const BRAZILIAN_CITIES = [
  'São Paulo', 'Rio de Janeiro', 'Curitiba', 'Belo Horizonte',
  'Florianópolis', 'Porto Alegre', 'Goiânia', 'Campinas',
  'Fortaleza', 'Salvador', 'Recife', 'Brasília',
];

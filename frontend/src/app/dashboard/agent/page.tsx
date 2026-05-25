'use client';
import { useState, useRef, useEffect } from 'react';
import { chatApi } from '@/lib/api';
import { Bot, User, Send, Loader2, FileText, Sparkles } from 'lucide-react';
import { v4 as uuid } from 'uuid';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  'Quais são os top 3 negócios fortes desta semana?',
  'Explique como calcular o yield líquido de um imóvel no Brasil',
  'Busque imóveis com preço reduzido em São Paulo',
  'Quais cidades têm o melhor cashflow no momento?',
];

export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: '👋 Olá! Sou seu Agente de IA especialista em investimentos imobiliários no Brasil.\n\nPosso ajudar com:\n• Análise de imóveis do ZAP, VivaReal ou OLX\n• Cálculo de yield, cashflow e ROI em R$\n• Comparativo entre cidades e bairros\n• Busca de vendedores motivados\n• Geração de Proposta de Compra\n• Estratégias de negociação\n\nComo posso ajudar hoje?',
    timestamp: new Date(),
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => uuid());
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg: Message = { role: 'user', content: msg, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const { data } = await chatApi.send(msg, sessionId);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro. Tente novamente em alguns instantes.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-xl border overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold">Agente de IA</h2>
            <p className="text-xs text-blue-100">Powered by Claude · Especialista em Imóveis no Brasil</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-blue-100">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'assistant' ? 'bg-blue-100' : 'bg-gray-200'
            }`}>
              {msg.role === 'assistant'
                ? <Bot className="h-4 w-4 text-blue-600" />
                : <User className="h-4 w-4 text-gray-600" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'assistant'
                ? 'bg-gray-50 text-gray-800'
                : 'bg-blue-600 text-white'
            }`}>
              {msg.content}
              <div className={`text-xs mt-1 ${msg.role === 'assistant' ? 'text-gray-400' : 'text-blue-200'}`}>
                {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Bot className="h-4 w-4 text-blue-600" />
            </div>
            <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm text-gray-500">Analisando...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {QUICK_PROMPTS.map(prompt => (
            <button
              key={prompt}
              onClick={() => sendMessage(prompt)}
              className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3" />
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Pergunte sobre investimentos, analise imóveis, gere LOIs..."
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="bg-blue-600 text-white rounded-xl px-4 py-2.5 hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Conectado ao Telegram · Histórico salvo automaticamente
        </p>
      </div>
    </div>
  );
}

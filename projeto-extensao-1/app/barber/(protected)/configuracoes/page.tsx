"use client";

export default function ConfiguracoesPage() {
  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <p className="text-[#cc0000] text-xs font-bold uppercase tracking-[0.3em] mb-2">
          Sistema
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#0a0a0a]">Configurações</h1>
        <p className="text-[#888888] text-sm mt-1">Taxas e preferências — disponível em breve.</p>
      </div>

      <div className="bg-white border border-[#e8e8e8] rounded-lg flex flex-col items-center justify-center py-24 text-center">
        <svg className="w-12 h-12 text-[#e8e8e8] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="text-[#888888] text-sm font-medium">
          Módulo Configurações será implementado em breve.
        </p>
      </div>
    </div>
  );
}

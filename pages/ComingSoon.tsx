
import React from 'react';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const ComingSoon: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 text-center relative overflow-hidden">
      {/* Fondo Decorativo Sutil */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-50 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

      <div className="animate-in fade-in zoom-in duration-1000 flex flex-col items-center max-w-5xl mx-auto">
        {/* Logo Animado */}
        <div className="mb-12 relative group cursor-default">
          <div className="absolute inset-0 bg-violet-600 rounded-[32px] blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-700"></div>
          <div className="relative bg-white p-10 rounded-[32px] border border-slate-100 shadow-2xl shadow-violet-100 transform transition-transform duration-700 hover:scale-105 hover:-rotate-3">
            <Heart size={80} className="text-violet-600 fill-current animate-pulse duration-[3000ms]" />
          </div>
        </div>
        
        {/* Título Principal */}
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 tracking-tighter leading-none">
          Pronto <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-sky-500">Donia</span> Chile
        </h1>
        
        {/* Lema */}
        <p className="text-2xl md:text-3xl text-slate-400 font-bold max-w-3xl mx-auto leading-tight tracking-tight mb-16">
          Toda ayuda empieza con una historia.
        </p>

        {/* Indicador de Estado */}
        <div className="inline-flex items-center gap-4 px-8 py-4 bg-slate-50 rounded-full border border-slate-100 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 cursor-default select-none">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
          </span>
          Construyendo comunidad
        </div>
      </div>
      
      <div className="absolute bottom-8 flex flex-col items-center gap-2">
         <span className="text-slate-300 text-[10px] font-black uppercase tracking-widest">© 2026 Donia SpA</span>
         <Link to="/home" className="text-slate-200 hover:text-violet-300 text-[9px] font-black uppercase tracking-widest transition-colors">
            Acceso Anticipado (Dev)
         </Link>
      </div>
    </div>
  );
};

export default ComingSoon;

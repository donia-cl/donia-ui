
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, Database, Cpu, Activity } from 'lucide-react';
import { CampaignService } from '../services/CampaignService';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isWizard = location.pathname.startsWith('/crear');
  
  const service = CampaignService.getInstance();
  const dbStatus = service.getConnectionStatus();
  const aiActive = service.checkAiAvailability();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="border-b border-slate-100 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-violet-600 p-1.5 rounded-xl group-hover:bg-violet-700 transition-colors shadow-sm">
                <Heart size={20} className="text-white fill-current" />
              </div>
              <span className="text-2xl font-bold text-slate-900 tracking-tight">Donia</span>
            </Link>
            
            {!isWizard && (
              <nav className="hidden md:flex items-center space-x-8">
                <Link to="/explorar" className="text-slate-600 hover:text-violet-600 font-medium transition-colors">Explorar</Link>
                <Link to="/crear" className="bg-violet-600 text-white px-5 py-2.5 rounded-full font-semibold hover:bg-violet-700 transition-all shadow-md shadow-violet-100">
                  Comenzar campaña
                </Link>
              </nav>
            )}

            {isWizard && (
              <Link to="/" className="text-slate-500 hover:text-slate-700 text-sm font-medium">
                Salir del editor
              </Link>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-slate-50 border-t border-slate-100 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-center md:text-left">
              <div className="flex justify-center md:justify-start items-center gap-2 mb-4">
                <Heart size={24} className="text-violet-600" />
                <span className="text-xl font-bold text-slate-800">Donia</span>
              </div>
              <p className="text-slate-500 text-sm">© 2026 Donia Chile. Construyendo puentes de solidaridad.</p>
            </div>

            <div className="flex flex-col items-center md:items-end gap-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Activity size={10} /> Estado del Sistema
              </span>
              <div className="flex flex-wrap justify-center md:justify-end gap-3">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[11px] font-bold border transition-all ${
                  dbStatus === 'cloud' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm shadow-emerald-100' 
                  : 'bg-amber-50 border-amber-200 text-amber-700'
                }`}>
                  <Database size={14} className={dbStatus === 'cloud' ? 'animate-pulse' : ''} />
                  {dbStatus === 'cloud' ? 'Supabase Nube' : 'Local (Faltan Llaves)'}
                </div>

                <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[11px] font-bold border transition-all ${
                  aiActive 
                  ? 'bg-sky-50 border-sky-200 text-sky-700 shadow-sm shadow-sky-100' 
                  : 'bg-slate-100 border-slate-200 text-slate-500'
                }`}>
                  <Cpu size={14} />
                  {aiActive ? 'Motor IA Activo' : 'IA Desactivada'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

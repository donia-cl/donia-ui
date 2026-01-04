
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, Cloud, CloudOff } from 'lucide-react';
import { CampaignService } from '../services/CampaignService';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isWizard = location.pathname.startsWith('/crear');
  const service = CampaignService.getInstance();
  const connectionStatus = service.getConnectionStatus();

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

      {!isWizard && (
        <footer className="bg-slate-50 border-t border-slate-100 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex justify-center items-center gap-2 mb-4">
              <Heart size={24} className="text-violet-600" />
              <span className="text-xl font-bold text-slate-800">Donia</span>
            </div>
            <p className="text-slate-500 text-sm mb-6">© 2026 Donia Chile. Juntos podemos lograr grandes cosas.</p>
            
            <div className="flex items-center justify-center gap-4">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                connectionStatus === 'cloud' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
              }`}>
                {connectionStatus === 'cloud' ? (
                  <><Cloud size={12} /> Cloud Sync Active</>
                ) : (
                  <><CloudOff size={12} /> Local Mode Only</>
                )}
              </div>
              
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                service.checkAiAvailability() ? 'bg-violet-50 text-violet-600 border border-violet-100' : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                IA {service.checkAiAvailability() ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

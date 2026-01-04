
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isWizard = location.pathname.startsWith('/crear');

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
                <Link to="/" className="text-slate-600 hover:text-violet-600 font-medium transition-colors">Cómo funciona</Link>
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
            <p className="text-slate-500 text-sm">© 2027 Donia Chile. Juntos podemos lograr grandes cosas.</p>
          </div>
        </footer>
      )}
    </div>
  );
};

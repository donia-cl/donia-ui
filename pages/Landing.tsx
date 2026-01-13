
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Zap, Users } from 'lucide-react';
import { CampaignService } from '../services/CampaignService';
import { CampaignData } from '../types';

const Landing: React.FC = () => {
  const [featuredCampaigns, setFeaturedCampaigns] = useState<CampaignData[]>([]);
  const service = CampaignService.getInstance();

  useEffect(() => {
    const load = async () => {
      const data = await service.getCampaigns();
      setFeaturedCampaigns(data.slice(0, 3));
    };
    load();
  }, []);

  return (
    <div className="bg-[#F8FAFC]">
        {/* Hero Section */}
        <section className="pt-24 pb-20 px-4">
            <div className="max-w-5xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-slate-200 shadow-sm mb-10 animate-in fade-in slide-in-from-bottom-3">
                    <span className="w-2 h-2 rounded-full bg-violet-600"></span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">JUNTOS SOMOS MÁS FUERTES</span>
                </div>
                
                <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] mb-8 animate-in fade-in slide-in-from-bottom-4">
                    Toda ayuda <span className="text-violet-600">empieza</span> con<br className="hidden md:block"/> una historia.
                </h1>
                
                <p className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl mx-auto mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-5">
                    Crea una campaña solidaria en minutos y llega a miles de personas en Chile. Donia es la forma más simple de recaudar fondos para lo que importa.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-6">
                    <Link to="/crear" className="px-8 py-4 bg-violet-600 text-white rounded-2xl font-bold text-lg hover:bg-violet-700 transition-all shadow-xl shadow-violet-200 flex items-center gap-2">
                        Comenzar ahora <ArrowRight size={20} />
                    </Link>
                    <Link to="/explorar" className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold text-lg hover:border-violet-200 hover:text-violet-600 transition-all shadow-sm">
                        Explorar campañas
                    </Link>
                </div>
            </div>
        </section>
        
        {/* Features Section */}
        <section className="py-12 px-4">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Feature 1 */}
                <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm text-center hover:shadow-xl transition-all duration-300 group">
                    <div className="w-16 h-16 bg-violet-50 text-violet-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                        <Zap size={32} className="fill-current" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-4">Rápido y Simple</h3>
                    <p className="text-slate-500 leading-relaxed font-medium">
                        Crea tu campaña en menos de 5 minutos con nuestro flujo guiado paso a paso.
                    </p>
                </div>

                {/* Feature 2 */}
                <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm text-center hover:shadow-xl transition-all duration-300 group">
                    <div className="w-16 h-16 bg-violet-50 text-violet-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                        <ShieldCheck size={32} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-4">Seguridad Total</h3>
                    <p className="text-slate-500 leading-relaxed font-medium">
                        Procesamiento de pagos seguro y verificación de identidad para cada causa.
                    </p>
                </div>

                {/* Feature 3 */}
                <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm text-center hover:shadow-xl transition-all duration-300 group">
                    <div className="w-16 h-16 bg-violet-50 text-violet-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                        <Users size={32} className="fill-current" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-4">Comunidad Activa</h3>
                    <p className="text-slate-500 leading-relaxed font-medium">
                        Conecta con miles de donantes en Chile dispuestos a apoyar tu historia.
                    </p>
                </div>
            </div>
        </section>

        {/* Featured Campaigns Section */}
        {featuredCampaigns.length > 0 && (
            <section className="py-24 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 mb-2">Causas destacadas</h2>
                            <p className="text-slate-500 font-medium">Historias recientes que necesitan tu apoyo hoy.</p>
                        </div>
                        <Link to="/explorar" className="hidden md:flex items-center gap-2 text-violet-600 font-black uppercase tracking-widest text-xs hover:underline">
                            Ver todas <ArrowRight size={16} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {featuredCampaigns.map(campaign => (
                            <Link key={campaign.id} to={`/campana/${campaign.id}`} className="group">
                                <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden hover:shadow-xl transition-all h-full flex flex-col">
                                    <div className="relative h-56 overflow-hidden">
                                        <img src={campaign.imagenUrl} alt={campaign.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                        <div className="absolute top-4 left-4">
                                            <span className="bg-white/90 backdrop-blur-sm text-slate-900 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
                                                {campaign.categoria}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-6 flex flex-col flex-grow">
                                        <h3 className="text-xl font-black text-slate-900 mb-2 line-clamp-2 group-hover:text-violet-600 transition-colors">{campaign.titulo}</h3>
                                        <div className="mt-auto pt-6">
                                            <div className="flex justify-between text-sm mb-2 font-bold">
                                                <span className="text-violet-600">${campaign.recaudado.toLocaleString('es-CL')}</span>
                                                <span className="text-slate-300">de ${campaign.monto.toLocaleString('es-CL')}</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-violet-600 rounded-full" style={{ width: `${Math.min((campaign.recaudado / campaign.monto) * 100, 100)}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        )}
    </div>
  );
};

export default Landing;

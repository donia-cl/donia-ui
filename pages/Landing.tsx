
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Users, Zap, Heart, MapPin, Loader2 } from 'lucide-react';
import { CampaignService } from '../services/CampaignService';
import { CampaignData } from '../types';

const CampaignCard: React.FC<{ campaign: CampaignData }> = ({ campaign }) => {
  const monto = campaign.monto || 1;
  const recaudado = campaign.recaudado || 0;
  const progress = Math.min((recaudado / monto) * 100, 100);
  
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col h-full">
      <div className="relative h-52 overflow-hidden">
        <img 
          src={campaign.imagenUrl || 'https://picsum.photos/800/600'} 
          alt={campaign.titulo} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
        />
        <div className="absolute top-4 left-4">
          <span className="bg-sky-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
            {campaign.categoria || 'General'}
          </span>
        </div>
      </div>
      <div className="p-6 flex-grow flex flex-col">
        <div className="flex items-center gap-1 text-slate-400 text-xs mb-3 font-medium">
          <MapPin size={12} className="text-violet-400" />
          <span>{campaign.ubicacion || 'Chile'}</span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-4 line-clamp-2 min-h-[3.5rem] group-hover:text-violet-600 transition-colors">{campaign.titulo || 'Sin Título'}</h3>
        
        <div className="mt-auto">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-bold text-violet-600">${recaudado.toLocaleString('es-CL')}</span>
            <span className="text-slate-400 font-medium">meta: ${monto.toLocaleString('es-CL')}</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-5">
            <div className="h-full bg-gradient-to-r from-violet-500 to-violet-700 rounded-full" style={{ width: `${progress}%` }} />
          </div>
          <Link to={`/campana/${campaign.id}`} className="w-full block text-center py-3 bg-slate-50 text-slate-700 font-bold rounded-2xl hover:bg-violet-600 hover:text-white transition-all shadow-sm">
            Ver detalle
          </Link>
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all group flex flex-col items-center text-center">
    <div className="w-14 h-14 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      <Icon size={28} />
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-500 leading-relaxed text-sm">{description}</p>
  </div>
);

const Landing: React.FC = () => {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const service = CampaignService.getInstance();

  useEffect(() => {
    const loadCampaigns = async () => {
      setLoading(true);
      try {
        const allCampaigns = await service.getCampaigns();
        setCampaigns(allCampaigns ? allCampaigns.slice(0, 3) : []);
      } catch (error) {
        console.error("No se pudieron cargar las campañas:", error);
      } finally {
        setLoading(false);
      }
    };
    loadCampaigns();
  }, []);

  return (
    <div className="overflow-hidden bg-white">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 md:pt-36 md:pb-48 bg-gradient-to-br from-violet-50 via-white to-sky-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100 mb-8 animate-bounce">
             <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
             </span>
             <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Juntos somos más fuertes</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 tracking-tight leading-[1.1]">
            Toda ayuda <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-sky-500">empieza con</span> <br className="hidden md:block"/> una historia.
          </h1>
          <p className="text-xl text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
            Crea una campaña solidaria en minutos y llega a miles de personas en Chile. Donia es la forma más simple de recaudar fondos para lo que importa.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-5">
            <Link 
              to="/crear" 
              className="w-full sm:w-auto bg-violet-600 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-violet-700 hover:shadow-2xl hover:shadow-violet-200 transition-all flex items-center justify-center gap-2 group"
            >
              Comenzar ahora
              <ArrowRight className="group-hover:translate-x-2 transition-transform" />
            </Link>
            <Link to="/explorar" className="w-full sm:w-auto px-10 py-5 rounded-2xl font-bold text-slate-700 hover:bg-white hover:shadow-md transition-all border border-slate-200 flex items-center justify-center gap-2">
              Explorar campañas
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Campaigns */}
      <section className="py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6 mb-16 text-center md:text-left">
            <div>
              <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Causas destacadas</h2>
              <p className="text-slate-500 font-medium text-lg">Apoya historias reales que necesitan de tu ayuda hoy.</p>
            </div>
            <Link to="/explorar" className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2">
              Ver todas <ArrowRight size={18} />
            </Link>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-violet-600 w-12 h-12" />
            </div>
          ) : campaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {campaigns.map(c => <CampaignCard key={c.id} campaign={c} />)}
            </div>
          ) : (
            <div className="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
               <Heart className="mx-auto text-slate-200 mb-4" size={48} />
               <p className="text-slate-400 font-bold">No hay campañas activas en este momento.</p>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-28 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <FeatureCard 
              icon={Zap}
              title="Rápido y Simple"
              description="Crea tu campaña en menos de 5 minutos con nuestro flujo guiado paso a paso."
            />
            <FeatureCard 
              icon={ShieldCheck}
              title="Seguridad Total"
              description="Procesamiento de pagos seguro y verificación de identidad para cada causa."
            />
            <FeatureCard 
              icon={Users}
              title="Comunidad Activa"
              description="Conecta con miles de donantes en Chile dispuestos a apoyar tu historia."
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;

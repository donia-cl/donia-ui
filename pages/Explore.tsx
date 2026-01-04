
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Search, ArrowUpRight } from 'lucide-react';
import { CampaignService } from '../services/CampaignService';
import { CampaignData } from '../types';

const ExploreCard = ({ campaign }: { campaign: CampaignData }) => {
  const progress = Math.min((campaign.recaudado / campaign.monto) * 100, 100);
  
  return (
    <Link to={`/campana/${campaign.id}`} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl transition-all group flex flex-col h-full">
      <div className="relative h-48 overflow-hidden">
        <img src={campaign.imagenUrl} alt={campaign.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-4 left-4">
          <span className="bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
            {campaign.categoria}
          </span>
        </div>
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-white p-2 rounded-full shadow-lg">
            <ArrowUpRight className="text-violet-600" />
          </div>
        </div>
      </div>
      <div className="p-6 flex-grow flex flex-col">
        <div className="flex items-center gap-1 text-slate-400 text-xs mb-2 font-medium">
          <MapPin size={12} className="text-violet-400" />
          <span>{campaign.ubicacion}</span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 min-h-[3.5rem] group-hover:text-violet-600 transition-colors">{campaign.titulo}</h3>
        
        <div className="mt-auto">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-bold text-violet-600">${campaign.recaudado.toLocaleString('es-CL')}</span>
            <span className="text-slate-400 font-medium">meta: ${campaign.monto.toLocaleString('es-CL')}</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-violet-600 rounded-full" style={{ width: `${progress}%` }} />
          </div>
          <div className="w-full py-2.5 bg-slate-50 text-slate-700 text-center font-bold rounded-xl group-hover:bg-violet-600 group-hover:text-white transition-all">
            Ayudar ahora
          </div>
        </div>
      </div>
    </Link>
  );
};

const Explore: React.FC = () => {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const service = CampaignService.getInstance();

  useEffect(() => {
    const load = async () => {
      const data = await service.getCampaigns();
      setCampaigns(data);
      setLoading(false);
    };
    load();
  }, []);

  const filteredCampaigns = campaigns.filter(c => 
    c.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Explorar causas</h1>
          <p className="text-slate-600 font-medium">Apoya una de las {campaigns.length} campañas activas en Donia.</p>
        </div>
        
        <div className="relative max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por título o categoría..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-violet-500 outline-none transition-all shadow-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-slate-100 h-96 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredCampaigns.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCampaigns.map(c => <ExploreCard key={c.id} campaign={c} />)}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-300">
            <Search size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-1">No encontramos resultados</h3>
          <p className="text-slate-500 mb-6 font-medium">Prueba con otros términos de búsqueda.</p>
          <button onClick={() => setSearchTerm('')} className="text-violet-600 font-bold hover:underline">Ver todas las campañas</button>
        </div>
      )}
    </div>
  );
};

export default Explore;

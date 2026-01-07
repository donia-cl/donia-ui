
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Heart, 
  Settings, 
  Trash2, 
  Edit3, 
  Plus, 
  Loader2, 
  AlertCircle, 
  BarChart3, 
  Clock, 
  CheckCircle2, 
  Wand2,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CampaignService } from '../services/CampaignService';
import { CampaignData } from '../types';

const Dashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const service = CampaignService.getInstance();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
    if (user) {
      loadMyCampaigns();
    }
  }, [user, authLoading]);

  const loadMyCampaigns = async () => {
    if (!user) return;
    setLoading(true);
    const data = await service.getUserCampaigns(user.id);
    setCampaigns(data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!user || !window.confirm('¿Estás seguro de que deseas eliminar esta campaña? Esta acción no se puede deshacer.')) return;
    setDeletingId(id);
    try {
      const success = await service.deleteCampaign(id, user.id);
      if (success) {
        setCampaigns(prev => prev.filter(c => c.id !== id));
      }
    } catch (e) {
      console.error("Error al eliminar:", e);
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-violet-600 animate-spin mb-4" />
        <span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Cargando tu panel...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-white min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-violet-100 text-violet-600 p-1.5 rounded-lg shadow-sm">
               <BarChart3 size={18} />
            </span>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Mi Panel</h1>
          </div>
          <p className="text-slate-500 font-medium">Gestiona tus campañas y revisa el impacto de tu ayuda.</p>
        </div>
        
        <Link 
          to="/crear" 
          className="flex items-center gap-2 bg-violet-600 text-white px-6 py-3.5 rounded-2xl font-black hover:bg-violet-700 transition-all shadow-xl shadow-violet-100"
        >
          <Plus size={20} /> Nueva Campaña
        </Link>
      </div>

      {campaigns.length > 0 ? (
        <div className="grid grid-cols-1 gap-8">
          {campaigns.map(campaign => {
            const progress = Math.min((campaign.recaudado / campaign.monto) * 100, 100);
            return (
              <div 
                key={campaign.id} 
                className="bg-white rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col md:flex-row group"
              >
                <div className="md:w-72 h-64 md:h-auto relative overflow-hidden">
                   <img src={campaign.imagenUrl} alt={campaign.titulo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
                   <div className="absolute bottom-4 left-4">
                      <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-white/20">
                         {campaign.categoria}
                      </span>
                   </div>
                </div>

                <div className="flex-grow p-8 flex flex-col justify-between">
                   <div>
                      <div className="flex justify-between items-start mb-4">
                         <h3 className="text-2xl font-black text-slate-900 line-clamp-1 pr-10">{campaign.titulo}</h3>
                         <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                            <CheckCircle2 size={12} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{campaign.estado}</span>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                         <div>
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Recaudado</span>
                            <p className="text-lg font-black text-violet-600">${campaign.recaudado.toLocaleString('es-CL')}</p>
                         </div>
                         <div>
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Objetivo</span>
                            <p className="text-lg font-black text-slate-900">${campaign.monto.toLocaleString('es-CL')}</p>
                         </div>
                         <div>
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Donantes</span>
                            <p className="text-lg font-black text-slate-900">{campaign.donantesCount}</p>
                         </div>
                         <div>
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Creada</span>
                            <p className="text-sm font-bold text-slate-500 flex items-center gap-1">
                               <Clock size={14} /> {new Date(campaign.fechaCreacion).toLocaleDateString('es-CL')}
                            </p>
                         </div>
                      </div>

                      <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden mb-8 border border-slate-100">
                         <div className="h-full bg-violet-600 rounded-full shadow-inner" style={{ width: `${progress}%` }}></div>
                      </div>
                   </div>

                   <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-slate-50">
                      <Link 
                        to={`/campana/${campaign.id}`}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all shadow-md"
                      >
                         Ver Pública <ArrowUpRight size={14} />
                      </Link>
                      
                      {/* Botón de edición - Idealmente abriría un modal o iría a una página de edición */}
                      <button 
                        onClick={() => navigate(`/campana/${campaign.id}/editar`)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:border-violet-200 hover:text-violet-600 transition-all"
                      >
                         <Edit3 size={14} /> Editar
                      </button>

                      <button 
                        disabled={deletingId === campaign.id}
                        onClick={() => handleDelete(campaign.id)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-rose-100 text-rose-500 rounded-xl font-bold text-xs hover:bg-rose-50 transition-all ml-auto disabled:opacity-50"
                      >
                         {deletingId === campaign.id ? (
                           <Loader2 size={14} className="animate-spin" />
                         ) : (
                           <Trash2 size={14} />
                         )}
                         Eliminar
                      </button>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-24 bg-slate-50 rounded-[48px] border-2 border-dashed border-slate-200">
           <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm text-slate-200">
              <Heart size={40} />
           </div>
           <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Aún no tienes campañas</h3>
           <p className="text-slate-500 mb-8 font-medium">Comienza hoy mismo y crea tu primera historia solidaria.</p>
           <Link to="/crear" className="bg-violet-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-violet-700 shadow-xl shadow-violet-100 transition-all inline-flex items-center gap-2">
              Empezar mi historia <ChevronRight size={20} />
           </Link>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

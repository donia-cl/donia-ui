
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
  ChevronRight,
  ArrowUpRight,
  Wallet,
  History,
  ShieldCheck,
  User as UserIcon,
  Copy,
  Pause,
  Play,
  Eye,
  Banknote,
  ArrowDownToLine,
  Mail,
  Check,
  Smartphone,
  Info,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CampaignService } from '../services/CampaignService';
import { CampaignData, FinancialSummary, Withdrawal, CampaignStatus } from '../types';

type TabType = 'resumen' | 'campanas' | 'finanzas' | 'donaciones' | 'seguridad' | 'perfil';

const TabButton = ({ id, activeId, onClick, icon: Icon, label }: { id: TabType, activeId: TabType, onClick: (id: TabType) => void, icon: any, label: string }) => (
  <button 
    onClick={() => onClick(id)}
    className={`flex items-center gap-3 px-6 py-4 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${
      activeId === id 
      ? 'border-violet-600 text-violet-600 bg-violet-50/50' 
      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
    }`}
  >
    <Icon size={18} />
    {label}
  </button>
);

const Dashboard: React.FC = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('resumen');
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [financials, setFinancials] = useState<FinancialSummary | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const service = CampaignService.getInstance();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
    if (user) {
      loadAllData();
    }
  }, [user, authLoading]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [cData, fData, wData] = await Promise.all([
        service.getUserCampaigns(user!.id),
        service.getFinancialSummary(user!.id),
        service.getWithdrawals(user!.id)
      ]);
      setCampaigns(cData);
      setFinancials(fData);
      setWithdrawals(wData);
    } catch (e) {
      console.error("Error loading dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: CampaignStatus) => {
    if (!user) return;
    setActionLoading(id);
    try {
      const success = await service.updateCampaignStatus(id, user.id, newStatus);
      if (success) {
        setCampaigns(prev => prev.map(c => c.id === id ? { ...c, estado: newStatus } : c));
      }
    } catch (e) {
      console.error("Error updating status:", e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (campaign: CampaignData) => {
    if (campaign.recaudado > 0) {
      alert("No se puede eliminar una campaña que ya ha recibido donaciones.");
      return;
    }
    if (!window.confirm('¿Eliminar esta campaña?')) return;
    
    setActionLoading(campaign.id);
    try {
      const success = await service.deleteCampaign(campaign.id, user!.id);
      if (success) {
        setCampaigns(prev => prev.filter(c => c.id !== campaign.id));
      }
    } catch (e) {
      console.error("Error delete:", e);
    } finally {
      setActionLoading(null);
    }
  };

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/#/campana/${id}`;
    navigator.clipboard.writeText(url);
    alert("¡Enlace copiado!");
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="w-10 h-10 text-violet-600 animate-spin mb-4" />
        <span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-slate-50 border-b border-slate-100 pt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-violet-600 text-white rounded-[24px] flex items-center justify-center text-2xl font-black shadow-lg">
                {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hola, {user?.user_metadata?.full_name?.split(' ')[0] || 'Usuario'}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle2 size={10} /> Verificado
                  </span>
                </div>
              </div>
            </div>
            <Link to="/crear" className="bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-black hover:bg-slate-800 transition-all flex items-center gap-2">
              <Plus size={20} /> Nueva Campaña
            </Link>
          </div>

          <div className="flex overflow-x-auto no-scrollbar border-b border-slate-200">
            <TabButton id="resumen" activeId={activeTab} onClick={setActiveTab} icon={BarChart3} label="Resumen" />
            <TabButton id="campanas" activeId={activeTab} onClick={setActiveTab} icon={Heart} label="Campañas" />
            <TabButton id="finanzas" activeId={activeTab} onClick={setActiveTab} icon={Wallet} label="Finanzas" />
            <TabButton id="donaciones" activeId={activeTab} onClick={setActiveTab} icon={History} label="Donaciones" />
            <TabButton id="seguridad" activeId={activeTab} onClick={setActiveTab} icon={ShieldCheck} label="Seguridad" />
            <TabButton id="perfil" activeId={activeTab} onClick={setActiveTab} icon={UserIcon} label="Perfil" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {activeTab === 'resumen' && (
          <div className="animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Total Recaudado</p>
                <p className="text-3xl font-black text-slate-900">${financials?.totalRecaudado.toLocaleString('es-CL')}</p>
              </div>
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Campañas Activas</p>
                <p className="text-3xl font-black text-slate-900">{campaigns.filter(c => c.estado === 'activa').length}</p>
              </div>
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Donantes</p>
                <p className="text-3xl font-black text-slate-900">{campaigns.reduce((acc, c) => acc + c.donantesCount, 0)}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'campanas' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-4">
            {campaigns.map(c => (
              <div key={c.id} className="bg-white rounded-[32px] border border-slate-100 p-6 flex flex-col md:flex-row gap-6 items-center">
                <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden shrink-0">
                  <img src={c.imagenUrl} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="flex-grow">
                  <h3 className="text-xl font-black text-slate-900 mb-1">{c.titulo}</h3>
                  <p className="text-violet-600 font-black text-sm">${c.recaudado.toLocaleString('es-CL')} / ${c.monto.toLocaleString('es-CL')}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => copyLink(c.id)} className="p-2 bg-slate-50 rounded-xl text-slate-600 hover:bg-slate-100"><Copy size={18} /></button>
                  <Link to={`/campana/${c.id}/editar`} className="p-2 bg-violet-50 rounded-xl text-violet-600 hover:bg-violet-100"><Edit3 size={18} /></Link>
                  <button onClick={() => handleDelete(c)} className="p-2 bg-rose-50 rounded-xl text-rose-500 hover:bg-rose-100"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'finanzas' && (
          <div className="animate-in fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100">
                   <p className="text-xs font-black text-emerald-700 uppercase mb-2">Disponible</p>
                   <p className="text-4xl font-black text-emerald-900">${financials?.disponibleRetiro.toLocaleString('es-CL')}</p>
                </div>
                <div className="bg-slate-900 p-8 rounded-3xl">
                   <p className="text-xs font-black text-slate-400 uppercase mb-2">Total Retirado</p>
                   <p className="text-4xl font-black text-white">${financials?.totalRetirado.toLocaleString('es-CL')}</p>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'seguridad' && (
          <div className="animate-in slide-in-from-right-4 duration-500 max-w-2xl">
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-10">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Seguridad</h3>
                  <p className="text-slate-500 font-medium">Gestiona la integridad de tu cuenta.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-6 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100">
                  <div className="flex items-center gap-4">
                    <Mail size={20} className="text-violet-600" />
                    <div>
                      <p className="font-black text-slate-900 text-sm">Email Verificado</p>
                      <p className="text-xs text-slate-500 font-medium">{user?.email}</p>
                    </div>
                  </div>
                  <Check className="text-emerald-500" size={20} />
                </div>
                <div className="p-6 bg-white rounded-2xl flex items-center justify-between border border-slate-100">
                  <div className="flex items-center gap-4">
                    <Smartphone size={20} className="text-slate-400" />
                    <div>
                      <p className="font-black text-slate-900 text-sm">Doble Factor (2FA)</p>
                      <p className="text-xs text-slate-400 font-medium">No activado</p>
                    </div>
                  </div>
                  <button className="text-violet-600 font-black text-xs uppercase hover:underline">Activar</button>
                </div>
                <div className="mt-8 p-6 bg-sky-50 rounded-2xl flex gap-3 items-start">
                   <Lock size={18} className="text-sky-600 mt-1" />
                   <p className="text-xs text-sky-900 font-medium leading-relaxed">Tus fondos están protegidos mediante cifrado AES-256. Donia nunca solicita tus claves por correo o WhatsApp.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'perfil' && (
          <div className="animate-in fade-in duration-500 max-w-xl">
            <div className="bg-white rounded-[40px] border border-slate-100 p-10">
              <h3 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Perfil</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">Nombre</label>
                  <p className="font-bold text-slate-800 p-4 bg-slate-50 rounded-2xl">{user?.user_metadata?.full_name}</p>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">Email</label>
                  <p className="font-bold text-slate-800 p-4 bg-slate-50 rounded-2xl">{user?.email}</p>
                </div>
                <button onClick={() => signOut()} className="w-full mt-6 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black hover:bg-rose-100 transition-all">Cerrar Sesión</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
};

export default Dashboard;


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
  User,
  Copy,
  Pause,
  Play,
  Eye,
  Banknote,
  ArrowDownToLine,
  Mail,
  Check,
  Smartphone,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CampaignService } from '../services/CampaignService';
import { CampaignData, FinancialSummary, Withdrawal, CampaignStatus } from '../types';

type TabType = 'resumen' | 'campanas' | 'finanzas' | 'donaciones' | 'seguridad' | 'perfil';

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
      alert("No se puede eliminar una campaña que ya ha recibido donaciones por motivos de trazabilidad legal.");
      return;
    }
    if (!window.confirm('¿Eliminar esta campaña? Esta acción no se puede deshacer.')) return;
    
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
    alert("¡Enlace copiado al portapapeles!");
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="w-10 h-10 text-violet-600 animate-spin mb-4" />
        <span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Cargando tu ecosistema Donia...</span>
      </div>
    );
  }

  const TabButton = ({ id, icon: Icon, label }: { id: TabType, icon: any, label: string }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-3 px-6 py-4 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${
        activeTab === id 
        ? 'border-violet-600 text-violet-600 bg-violet-50/50' 
        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  return (
    <div className="bg-white min-h-screen">
      {/* Dashboard Header */}
      <div className="bg-slate-50 border-b border-slate-100 pt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-violet-600 text-white rounded-[24px] flex items-center justify-center text-2xl font-black shadow-lg shadow-violet-100">
                {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hola, {user?.user_metadata?.full_name?.split(' ')[0] || 'Usuario'}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle2 size={10} /> Email Verificado
                  </span>
                  <span className="bg-slate-200 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                    ID: {user?.id.substring(0, 8)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
               <Link to="/crear" className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-100">
                  <Plus size={20} /> Nueva Campaña
               </Link>
            </div>
          </div>

          <div className="flex overflow-x-auto no-scrollbar border-b border-slate-200">
            <TabButton id="resumen" icon={BarChart3} label="Resumen" />
            <TabButton id="campanas" icon={Heart} label="Mis Campañas" />
            <TabButton id="finanzas" icon={Wallet} label="Finanzas" />
            <TabButton id="donaciones" icon={History} label="Donaciones" />
            <TabButton id="seguridad" icon={ShieldCheck} label="Seguridad" />
            <TabButton id="perfil" icon={User} label="Perfil" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* TAB: RESUMEN */}
        {activeTab === 'resumen' && (
          <div className="animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Total Recaudado</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <Banknote size={24} />
                  </div>
                  <p className="text-3xl font-black text-slate-900">${financials?.totalRecaudado.toLocaleString('es-CL')}</p>
                </div>
              </div>
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Campañas Activas</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center">
                    <Heart size={24} />
                  </div>
                  <p className="text-3xl font-black text-slate-900">{campaigns.filter(c => c.estado === 'activa').length}</p>
                </div>
              </div>
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Aportes Recibidos</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center">
                    <Check size={24} />
                  </div>
                  <p className="text-3xl font-black text-slate-900">{campaigns.reduce((acc, c) => acc + c.donantesCount, 0)}</p>
                </div>
              </div>
            </div>

            <div className="bg-violet-600 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl shadow-violet-200">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
               <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                  <div className="flex-grow">
                    <h2 className="text-3xl font-black mb-4 tracking-tight">Maximiza tu impacto</h2>
                    <p className="text-violet-100 font-medium text-lg leading-relaxed max-w-xl">
                      Las campañas compartidas en redes sociales recaudan en promedio un 35% más. Utiliza nuestras herramientas de difusión.
                    </p>
                  </div>
                  <Link to="/acerca" className="bg-white text-violet-600 px-8 py-4 rounded-2xl font-black hover:bg-slate-50 transition-all flex items-center gap-2 whitespace-nowrap">
                    Ver guías de éxito <ArrowUpRight size={20} />
                  </Link>
               </div>
            </div>
          </div>
        )}

        {/* TAB: MIS CAMPAÑAS */}
        {activeTab === 'campanas' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            {campaigns.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {campaigns.map(c => (
                  <div key={c.id} className="bg-white rounded-[32px] border border-slate-100 p-6 flex flex-col md:flex-row gap-8 items-center group hover:shadow-lg transition-all">
                    <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden shrink-0 relative">
                      <img src={c.imagenUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
                      <div className={`absolute top-2 left-2 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg ${
                        c.estado === 'activa' ? 'bg-emerald-500 text-white' : 
                        c.estado === 'borrador' ? 'bg-slate-400 text-white' :
                        c.estado === 'en_revision' ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'
                      }`}>
                        {c.estado.replace('_', ' ')}
                      </div>
                    </div>
                    <div className="flex-grow min-w-0">
                      <h3 className="text-xl font-black text-slate-900 mb-2 truncate">{c.titulo}</h3>
                      <div className="flex flex-wrap gap-6 mb-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recaudado</span>
                          <span className="text-base font-black text-violet-600">${c.recaudado.toLocaleString('es-CL')}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meta</span>
                          <span className="text-base font-bold text-slate-800">${c.monto.toLocaleString('es-CL')}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Donantes</span>
                          <span className="text-base font-bold text-slate-800">{c.donantesCount}</span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                        <div className="h-full bg-violet-600" style={{ width: `${Math.min((c.recaudado/c.monto)*100, 100)}%` }}></div>
                      </div>
                    </div>
                    <div className="flex flex-wrap md:flex-col gap-2 w-full md:w-auto shrink-0">
                      {/* Acciones por estado */}
                      {c.estado === 'borrador' && (
                        <>
                          <Link to={`/campana/${c.id}/editar`} className="flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-black hover:bg-violet-700 transition-all"><Edit3 size={14} /> Editar</Link>
                          <button onClick={() => handleDelete(c)} className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-rose-100 text-rose-500 rounded-xl text-xs font-black hover:bg-rose-50"><Trash2 size={14} /> Eliminar</button>
                        </>
                      )}
                      {c.estado === 'activa' && (
                        <>
                          <button onClick={() => copyLink(c.id)} className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800"><Copy size={14} /> Link</button>
                          <Link to={`/campana/${c.id}`} className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-black hover:border-violet-200"><Eye size={14} /> Ver</Link>
                          <button onClick={() => handleStatusChange(c.id, 'pausada')} className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-xs font-black border border-amber-100 hover:bg-amber-100"><Pause size={14} /> Pausar</button>
                        </>
                      )}
                      {c.estado === 'pausada' && (
                        <button onClick={() => handleStatusChange(c.id, 'activa')} className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black border border-emerald-100 hover:bg-emerald-100"><Play size={14} /> Reanudar</button>
                      )}
                      {c.estado === 'finalizada' && (
                        <Link to={`/campana/${c.id}`} className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-200"><History size={14} /> Historial</Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-slate-50 rounded-[48px] border-2 border-dashed border-slate-200">
                <Heart size={48} className="mx-auto text-slate-200 mb-6" />
                <h3 className="text-2xl font-black text-slate-900 mb-2">Aún no tienes campañas</h3>
                <p className="text-slate-500 mb-8 font-medium">Empieza hoy mismo y crea tu primera historia solidaria.</p>
                <Link to="/crear" className="bg-violet-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-violet-700 transition-all inline-flex items-center gap-2 shadow-xl shadow-violet-100">Crear mi historia <ChevronRight size={20} /></Link>
              </div>
            )}
          </div>
        )}

        {/* TAB: FINANZAS */}
        {activeTab === 'finanzas' && (
          <div className="animate-in fade-in duration-500 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Total Recaudado</span>
                <p className="text-2xl font-black text-slate-900">${financials?.totalRecaudado.toLocaleString('es-CL')}</p>
              </div>
              <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 shadow-sm text-center">
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest block mb-3">Disponible Retiro</span>
                <p className="text-2xl font-black text-emerald-900">${financials?.disponibleRetiro.toLocaleString('es-CL')}</p>
              </div>
              <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 shadow-sm text-center">
                <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest block mb-3">En Proceso</span>
                <p className="text-2xl font-black text-amber-900">${financials?.enProceso.toLocaleString('es-CL')}</p>
              </div>
              <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-sm text-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Total Retirado</span>
                <p className="text-2xl font-black">${financials?.totalRetirado.toLocaleString('es-CL')}</p>
              </div>
            </div>

            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
               <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Historial de Retiros</h3>
                  <button 
                    disabled={financials?.disponibleRetiro === 0}
                    className="flex items-center gap-2 bg-violet-600 text-white px-5 py-2.5 rounded-xl font-black text-xs hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ArrowDownToLine size={16} /> Solicitar Retiro
                  </button>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Campaña</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {withdrawals.length > 0 ? withdrawals.map(w => (
                        <tr key={w.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-5 text-sm font-bold text-slate-700">{new Date(w.fecha).toLocaleDateString('es-CL')}</td>
                          <td className="px-8 py-5 text-sm font-medium text-slate-500">{w.campaignTitle}</td>
                          <td className="px-8 py-5 text-sm font-black text-slate-900">${w.monto.toLocaleString('es-CL')}</td>
                          <td className="px-8 py-5">
                            <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                              w.estado === 'completado' ? 'bg-emerald-50 text-emerald-600' :
                              w.estado === 'pendiente' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                            }`}>
                              {w.estado}
                            </span>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={4} className="px-8 py-12 text-center text-slate-400 font-bold text-sm italic">No se registran retiros aún.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
               </div>
            </div>
          </div>
        )}

        {/* TAB: DONACIONES */}
        {activeTab === 'donaciones' && (
          <div className="animate-in fade-in duration-500">
             <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50">
                   <h3 className="text-xl font-black text-slate-900 tracking-tight">Últimos Aportes</h3>
                </div>
                <div className="divide-y divide-slate-50">
                   {campaigns.flatMap(c => c.donations || []).length > 0 ? (
                     campaigns.flatMap(c => (c.donations || []).map(d => ({...d, campaignTitle: c.titulo})))
                      .sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                      .map(don => (
                        <div key={don.id} className="p-6 flex flex-col md:flex-row justify-between items-center gap-4 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-4 w-full md:w-auto">
                             <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center font-black text-xs uppercase border border-white shadow-sm">
                               {don.nombreDonante.charAt(0)}
                             </div>
                             <div>
                                <p className="font-black text-slate-900 text-sm">{don.nombreDonante}</p>
                                <p className="text-[11px] text-slate-400 font-bold truncate max-w-[200px] md:max-w-xs">{don.campaignTitle}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                             <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{new Date(don.fecha).toLocaleDateString('es-CL')}</p>
                                <p className="text-sm font-black text-emerald-600">+${don.monto.toLocaleString('es-CL')}</p>
                             </div>
                             <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 opacity-50">
                                <ChevronRight size={16} />
                             </div>
                          </div>
                        </div>
                      ))
                   ) : (
                     <div className="p-20 text-center">
                        <Info size={40} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-slate-400 font-bold">Aún no se registran donaciones en tus campañas.</p>
                     </div>
                   )}
                </div>
             </div>
          </div>
        )}

        {/* TAB: SEGURIDAD */}
        {activeTab === 'seguridad' && (
          <div className="animate-in slide-in-from-right-4 duration-500 max-w-3xl">
             <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-10">
                <div className="flex items-center gap-4 mb-10">
                   <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center shadow-sm">
                      <ShieldCheck size={28} />
                   </div>
                   <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">Estado de Verificación</h3>
                      <p className="text-slate-500 font-medium">La verificación aumenta la confianza de los donantes hasta en un 60%.</p>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="p-6 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                            <Mail size={20} />
                         </div>
                         <div>
                            <p className="font-black text-slate-900 text-sm">Email Verificado</p>
                            <p className="text-xs text-slate-500 font-medium">{user?.email}</p>
                         </div>
                      </div>
                      <span className="bg-emerald-500 text-white p-1 rounded-full"><Check size={14} /></span>
                   </div>

                   <div className="p-6 bg-white rounded-2xl flex items-center justify-between border border-slate-200">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center">
                            <User size={20} />
                         </div>
                         <div>
                            <p className="font-black text-slate-900 text-sm">Identidad (Cédula)</p>
                            <p className="text-xs text-slate-400 font-medium">No verificado</p>
                         </div>
                      </div>
                      <button className="text-violet-600 font-black text-xs uppercase tracking-widest hover:underline">Verificar ahora</button>
                   </div>

                   <div className="p-6 bg-white rounded-2xl flex items-center justify-between border border-slate-200">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center">
                            <Smartphone size={20} />
                         </div>
                         <div>
                            <p className="font-black text-slate-900 text-sm">Teléfono (WhatsApp)</p>
                            <p className="text-xs text-slate-400 font-medium">No vinculado</p>
                         </div>
                      </div>
                      <button className="text-violet-600 font-black text-xs uppercase tracking-widest hover:underline">Vincular</button>
                   </div>
                </div>

                <div className="mt-12 p-8 bg-sky-50 rounded-3xl border border-sky-100">
                   <h4 className="font-black text-sky-900 mb-2 flex items-center gap-2">
                     <Lock size={16} /> Tus datos están protegidos
                   </h4>
                   <p className="text-sm text-sky-800/80 leading-relaxed font-medium">
                     Donia cumple con la Ley 19.628 de Protección de Datos Personales en Chile. Solo utilizamos tus datos para procesos de verificación de retiros.
                   </p>
                </div>
             </div>
          </div>
        )}

        {/* TAB: PERFIL */}
        {activeTab === 'perfil' && (
          <div className="animate-in fade-in duration-500 max-w-2xl">
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-10">
               <div className="mb-10">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Datos del Perfil</h3>
                  <p className="text-slate-500 font-medium">Gestiona tu información personal y cuenta.</p>
               </div>

               <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Nombre Completo</label>
                    <input 
                      type="text" 
                      className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-2xl outline-none font-bold text-slate-900 transition-all"
                      value={user?.user_metadata?.full_name || ''}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Email</label>
                    <input 
                      type="text" 
                      className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-2xl outline-none font-bold text-slate-400 transition-all"
                      value={user?.email || ''}
                      readOnly
                    />
                  </div>
               </div>

               <div className="mt-12 pt-12 border-t border-slate-100">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Acciones de cuenta</h4>
                  <div className="flex flex-col gap-4">
                     <button className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all group">
                        <span className="font-bold text-slate-700">Cambiar Contraseña</span>
                        <ChevronRight className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                     </button>
                     <button 
                      onClick={() => signOut()}
                      className="flex items-center justify-between p-5 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100 transition-all group"
                     >
                        <span className="font-black text-sm uppercase tracking-widest">Cerrar Sesión</span>
                        <ArrowUpRight className="group-hover:translate-x-1 transition-transform" />
                     </button>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default Dashboard;

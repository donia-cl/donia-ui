import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Heart, 
  Trash2, 
  Edit3, 
  Plus, 
  Loader2, 
  BarChart3, 
  CheckCircle2, 
  Wallet,
  History,
  ShieldCheck,
  User as UserIcon,
  Users,
  Copy,
  Eye,
  Banknote,
  ArrowDownToLine,
  Mail,
  Check,
  Smartphone,
  Info,
  Lock,
  ArrowRight,
  ArrowUpRight,
  HeartHandshake,
  Download,
  HelpCircle,
  AlertOctagon,
  AlertTriangle,
  Save,
  X,
  Timer,
  ExternalLink,
  ShieldAlert,
  KeyRound,
  Fingerprint,
  // Fix: Added missing Calendar icon import
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthService } from '../services/AuthService';
import { CampaignService } from '../services/CampaignService';
import { CampaignData, FinancialSummary, Withdrawal, Donation, Profile } from '../types';
import { formatRut, validateRut, formatPhone, validateChileanPhone } from '../utils/validation';

type TabType = 'resumen' | 'donaciones' | 'finanzas' | 'seguridad' | 'perfil';

const Dashboard: React.FC = () => {
  const { user, profile, setProfile, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('resumen');
  
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [financials, setFinancials] = useState<(FinancialSummary & { enCursoNoDisponible: number }) | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    rut: '',
    phone: ''
  });
  
  const [rutError, setRutError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [withdrawalActionLoading, setWithdrawalActionLoading] = useState<string | null>(null);
  const [resetPassLoading, setResetPassLoading] = useState(false);
  
  const service = CampaignService.getInstance();
  const authService = AuthService.getInstance();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
    if (user) {
      loadAllData();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || '',
        rut: profile.rut || '',
        phone: profile.phone || ''
      });
    }
  }, [profile]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [cData, dData, fData, wData] = await Promise.all([
        service.getUserCampaigns(user!.id),
        service.getUserDonations(user!.id),
        service.getFinancialSummary(user!.id),
        service.getWithdrawals(user!.id)
      ]);
      setCampaigns(cData);
      setDonations(dData);
      setFinancials(fData);
      setWithdrawals(wData);
    } catch (e) {
      console.error("Error loading dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawalRequest = async (campaign: CampaignData) => {
    if (!profile?.rut || !profile?.phone) {
      alert("Debes completar tu RUT y Teléfono en la pestaña 'Perfil' antes de cobrar.");
      setActiveTab('perfil');
      return;
    }

    const confirmMsg = `¿Deseas solicitar el retiro de $${campaign.recaudado.toLocaleString('es-CL')} para la campaña "${campaign.titulo}"?`;
    if (!window.confirm(confirmMsg)) return;

    setWithdrawalActionLoading(campaign.id);
    try {
      await service.requestWithdrawal(user!.id, campaign.id, campaign.recaudado);
      alert("¡Solicitud enviada! Te hemos enviado un correo con los detalles.");
      await loadAllData(); 
    } catch (e: any) {
      alert(e.message);
    } finally {
      setWithdrawalActionLoading(null);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setResetPassLoading(true);
    try {
      // Usamos el cliente de supabase expuesto para enviar el reset
      const client = authService.getSupabase();
      if (client) {
        await client.auth.resetPasswordForEmail(user.email, {
          redirectTo: `${window.location.origin}/dashboard?tab=seguridad`,
        });
        alert("Te hemos enviado un correo para restablecer tu contraseña.");
      }
    } catch (e) {
      alert("Hubo un error al procesar la solicitud.");
    } finally {
      setResetPassLoading(false);
    }
  };

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const formatted = formatRut(val);
    setProfileForm(prev => ({ ...prev, rut: formatted }));
    if (val.length > 2 && !validateRut(formatted)) setRutError('RUT inválido');
    else setRutError(null);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!/^[0-9+\s]*$/.test(val)) return;
    setProfileForm(prev => ({ ...prev, phone: val }));
    if (val.length > 8 && !validateChileanPhone(val)) setPhoneError('Formato: +56 9 XXXXXXXX');
    else setPhoneError(null);
  };

  const handlePhoneBlur = () => {
    const formatted = formatPhone(profileForm.phone);
    setProfileForm(prev => ({ ...prev, phone: formatted }));
    if (!validateChileanPhone(formatted) && formatted.length > 0) setPhoneError('Número inválido');
    else setPhoneError(null);
  }

  const handleUpdateProfile = async () => {
    if (!user) return;
    if (profileForm.rut && !validateRut(profileForm.rut)) return alert("RUT inválido.");
    if (profileForm.phone && !validateChileanPhone(profileForm.phone)) return alert("Teléfono móvil chileno inválido.");

    setProfileSaving(true);
    try {
      const updatedProfile = await authService.updateProfile(user.id, {
        full_name: profileForm.full_name,
        rut: profileForm.rut,
        phone: profileForm.phone
      });
      setProfile(updatedProfile);
      setIsEditingProfile(false);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 5000);
    } catch (e) {
      console.error(e);
      alert("Error actualizando perfil.");
    } finally {
      setProfileSaving(false);
    }
  };

  const copyLink = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/campana/${id}`);
    alert("¡Enlace copiado!");
  };

  const isProfileIncomplete = !profile?.rut || !profile?.phone;
  const dashboardName = profile?.full_name || user?.user_metadata?.full_name || 'Usuario';
  const dashboardInitial = dashboardName.charAt(0).toUpperCase();

  const finishedCampaignsWithFunds = campaigns.filter(c => {
    const now = new Date();
    const isFinished = c.estado === 'finalizada' || (c.fechaTermino && new Date(c.fechaTermino) < now);
    const yaRetirado = withdrawals
      .filter(w => w.campaignId === c.id && (w.estado === 'pendiente' || w.estado === 'completado'))
      .reduce((acc, w) => acc + w.monto, 0);
    return isFinished && (c.recaudado - yaRetirado > 0);
  });

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="w-10 h-10 text-violet-600 animate-spin mb-4" />
        <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Cargando panel...</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/50 min-h-screen pb-20">
      <div className="bg-white border-b border-slate-100 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-slate-900 text-white rounded-[24px] flex items-center justify-center text-2xl font-black shadow-2xl">
                {dashboardInitial}
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mi Panel de Control</p>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hola, {dashboardName.split(' ')[0]}</h1>
              </div>
            </div>
            <Link to="/crear" className="bg-violet-600 text-white px-6 py-4 rounded-2xl font-black hover:bg-violet-700 transition-all flex items-center gap-2 shadow-xl shadow-violet-100">
              <Plus size={20} /> Nueva Campaña
            </Link>
          </div>

          <nav className="flex gap-8 mt-10 overflow-x-auto no-scrollbar">
            {[
              { id: 'resumen', label: 'Mis Campañas', icon: BarChart3 },
              { id: 'donaciones', label: 'Mis Donaciones', icon: HeartHandshake },
              { id: 'finanzas', label: 'Finanzas', icon: Wallet },
              { id: 'seguridad', label: 'Seguridad', icon: ShieldCheck },
              { id: 'perfil', label: 'Perfil', icon: UserIcon }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 pb-4 text-xs font-black transition-all border-b-2 uppercase tracking-widest relative ${
                  activeTab === tab.id ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <tab.icon size={14} /> {tab.label}
                {tab.id === 'perfil' && isProfileIncomplete && <span className="absolute -top-1 -right-2 w-2 h-2 bg-amber-500 rounded-full"></span>}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {activeTab === 'resumen' && (
          <div className="space-y-10 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-2 bg-gradient-to-br from-violet-600 to-indigo-700 p-8 rounded-[40px] text-white shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><Banknote size={120} /></div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-70">Recaudación Total</p>
                <p className="text-5xl font-black tracking-tight">${financials?.totalRecaudado.toLocaleString('es-CL')}</p>
                <div className="mt-8 flex items-center gap-2 text-xs font-bold bg-white/10 w-fit px-3 py-1.5 rounded-full">
                  <ArrowUpRight size={14} /> Registro histórico
                </div>
              </div>
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Campañas</p>
                 <p className="text-4xl font-black text-slate-900">{campaigns.length}</p>
                 <div className="absolute bottom-6 right-6 text-violet-100"><Heart size={40} className="fill-current" /></div>
              </div>
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Impacto</p>
                 <p className="text-4xl font-black text-slate-900">{campaigns.reduce((acc, c) => acc + c.donantesCount, 0)}</p>
                 <div className="absolute bottom-6 right-6 text-sky-100"><Users size={40} className="fill-current" /></div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {campaigns.length > 0 ? campaigns.map(c => (
                <div key={c.id} className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col md:flex-row items-center gap-6 hover:shadow-lg transition-all group">
                  <div className="w-full md:w-32 h-24 rounded-2xl overflow-hidden shrink-0 bg-slate-100">
                    <img src={c.imagenUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                  </div>
                  <div className="flex-grow w-full">
                     <h3 className="text-lg font-black text-slate-900 mb-1 group-hover:text-violet-600 transition-colors">{c.titulo}</h3>
                     <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${c.estado === 'activa' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div> {c.estado}</span>
                        {c.fechaTermino && (
                          <span className="flex items-center gap-1"><Timer size={12} /> {new Date(c.fechaTermino) < new Date() ? 'Finalizada' : `Termina: ${new Date(c.fechaTermino).toLocaleDateString()}`}</span>
                        )}
                     </div>
                  </div>
                  <div className="flex gap-2 shrink-0 w-full md:w-auto">
                     <button onClick={() => copyLink(c.id)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl transition-colors"><Copy size={18} /></button>
                     <Link to={`/campana/${c.id}`} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl transition-colors"><Eye size={18} /></Link>
                     <Link to={`/campana/${c.id}/editar`} className="p-3 bg-violet-50 text-violet-600 hover:bg-violet-600 hover:text-white rounded-xl transition-all"><Edit3 size={18} /></Link>
                  </div>
                </div>
              )) : (
                <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-bold mb-6">Aún no has creado ninguna campaña.</p>
                  <Link to="/crear" className="bg-violet-600 text-white px-8 py-4 rounded-2xl font-black inline-flex items-center gap-2 shadow-lg">Comenzar ahora <ArrowRight size={18} /></Link>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'donaciones' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <HeartHandshake className="text-violet-600" /> Mi historial de aportes
            </h2>
            
            {donations.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {donations.map((d) => (
                  <div key={d.id} className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-col md:flex-row items-center gap-6 hover:border-violet-100 transition-all group">
                    <div className="w-full md:w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-slate-100">
                       <img src={d.campaign?.imagenUrl || 'https://picsum.photos/200/200'} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex-grow w-full">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Donaste a</p>
                       <h3 className="text-lg font-black text-slate-900 leading-tight mb-2">{d.campaign?.titulo}</h3>
                       <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <span className="flex items-center gap-1.5"><Calendar size={12} /> {new Date(d.fecha).toLocaleDateString('es-CL')}</span>
                          <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">Exitoso</span>
                       </div>
                    </div>
                    <div className="text-right w-full md:w-auto">
                       <p className="text-2xl font-black text-slate-900">${d.monto.toLocaleString('es-CL')}</p>
                       <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Aporte solidario</p>
                    </div>
                    <Link to={`/campana/${d.campaignId}`} className="p-3 bg-slate-50 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all">
                      <Eye size={20} />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-24 bg-white rounded-[40px] border-2 border-dashed border-slate-100 text-center px-10">
                 <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Heart size={40} className="text-slate-200" />
                 </div>
                 <h3 className="text-xl font-black text-slate-900 mb-2">Aún no has realizado donaciones</h3>
                 <p className="text-slate-400 font-medium text-sm mb-8">Tus aportes solidarios aparecerán aquí para que lleves un registro de tu ayuda.</p>
                 <Link to="/explorar" className="inline-flex items-center gap-2 bg-violet-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-violet-700 transition-all shadow-lg">Explorar causas <ArrowRight size={20} /></Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'finanzas' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-emerald-50 p-10 rounded-[40px] border border-emerald-100 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-6 text-emerald-200/50 group-hover:scale-110 transition-transform"><Wallet size={120} /></div>
                   <div className="relative z-10">
                      <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-4">Disponible para Retiro (Campañas Finalizadas)</p>
                      <p className="text-5xl font-black text-emerald-900 tracking-tighter mb-4">${financials?.disponibleRetiro.toLocaleString('es-CL')}</p>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 bg-emerald-100/50 px-3 py-1 rounded-full w-fit">
                        <CheckCircle2 size={12} /> Fondos liberados para transferencia
                      </div>
                   </div>
                </div>
                <div className="bg-slate-100 p-10 rounded-[40px] border border-slate-200 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-6 text-slate-200 group-hover:scale-110 transition-transform"><Timer size={120} /></div>
                   <div className="relative z-10">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Recaudación en curso (No retirable)</p>
                      <p className="text-5xl font-black text-slate-600 tracking-tighter mb-4">${financials?.enCursoNoDisponible.toLocaleString('es-CL')}</p>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 bg-slate-200/50 px-3 py-1 rounded-full w-fit">
                        <Info size={12} /> Se liberan al finalizar cada campaña
                      </div>
                   </div>
                </div>
             </div>

             {/* Sección: Campañas por cobrar */}
             <div className="space-y-4">
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                   <ArrowDownToLine className="text-violet-600" /> Campañas con fondos por cobrar
                </h3>
                {finishedCampaignsWithFunds.length > 0 ? finishedCampaignsWithFunds.map(c => {
                   const yaRetiradoOCursando = withdrawals
                    .filter(w => w.campaignId === c.id && (w.estado === 'pendiente' || w.estado === 'completado'))
                    .reduce((acc, w) => acc + w.monto, 0);
                   const retirable = c.recaudado - yaRetiradoOCursando;
                   
                   return (
                     <div key={c.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-violet-200 transition-all">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-slate-50 rounded-xl overflow-hidden"><img src={c.imagenUrl} className="w-full h-full object-cover" /></div>
                           <div>
                              <h4 className="font-black text-slate-900 text-sm">{c.titulo}</h4>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">Campaña Finalizada • {c.donantesCount} Donantes</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-6">
                           <div className="text-right">
                              <p className="text-lg font-black text-slate-900">${retirable.toLocaleString('es-CL')}</p>
                              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Saldo Cobrable</p>
                           </div>
                           <button 
                             onClick={() => handleWithdrawalRequest(c)}
                             disabled={withdrawalActionLoading === c.id}
                             className="bg-violet-600 text-white px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-violet-700 transition-all shadow-lg flex items-center gap-2"
                           >
                             {withdrawalActionLoading === c.id ? <Loader2 className="animate-spin" size={14} /> : <ArrowDownToLine size={14} />}
                             Cobrar Fondos
                           </button>
                        </div>
                     </div>
                   );
                }) : (
                  <div className="p-10 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100 text-slate-400 font-bold text-sm italic">
                     No tienes campañas finalizadas con fondos pendientes de retiro.
                  </div>
                )}
             </div>
             
             <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                   <h3 className="text-xl font-black text-slate-900 tracking-tight">Historial de Movimientos</h3>
                </div>
                <div className="divide-y divide-slate-50">
                   {withdrawals.length > 0 ? withdrawals.map(w => (
                     <div key={w.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400"><History size={18} /></div>
                           <div>
                              <p className="font-black text-slate-900 text-sm">Retiro: {w.campaignTitle}</p>
                              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{new Date(w.fecha).toLocaleDateString('es-CL')}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="font-black text-slate-900 text-sm">-${w.monto.toLocaleString('es-CL')}</p>
                           <span className={`text-[10px] font-black uppercase tracking-widest ${w.estado === 'completado' ? 'text-emerald-600' : 'text-amber-500'}`}>{w.estado}</span>
                        </div>
                     </div>
                   )) : (
                     <div className="p-20 text-center text-slate-300 font-bold italic">Sin movimientos históricos.</div>
                   )}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'seguridad' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8 max-w-2xl">
             <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 text-slate-50"><ShieldCheck size={120} /></div>
                <div className="relative z-10">
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Protección de Cuenta</h3>
                   <p className="text-slate-500 font-medium mb-10">Gestiona la seguridad de tu acceso y las sesiones activas.</p>
                   
                   <div className="space-y-6">
                      <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-violet-600 shadow-sm">
                               <Mail size={24} />
                            </div>
                            <div>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Principal</p>
                               <p className="font-bold text-slate-900">{user?.email}</p>
                            </div>
                         </div>
                         <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Verificado</div>
                      </div>

                      <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-violet-600 shadow-sm">
                               <KeyRound size={24} />
                            </div>
                            <div>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contraseña</p>
                               <p className="font-bold text-slate-900">••••••••••••••</p>
                            </div>
                         </div>
                         <button 
                           onClick={handlePasswordReset}
                           disabled={resetPassLoading}
                           className="text-violet-600 font-black text-xs uppercase tracking-widest hover:underline disabled:opacity-50"
                         >
                           {resetPassLoading ? 'Enviando...' : 'Cambiar'}
                         </button>
                      </div>

                      <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 opacity-60">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm">
                               <Fingerprint size={24} />
                            </div>
                            <div>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Doble Factor (2FA)</p>
                               <p className="font-bold text-slate-900">Desactivado</p>
                            </div>
                         </div>
                         <span className="text-[10px] font-black uppercase text-slate-400">Próximamente</span>
                      </div>
                   </div>
                </div>
             </div>

             <div className="bg-rose-50 border border-rose-100 p-8 rounded-[40px] flex items-start gap-5">
                <div className="bg-rose-100 p-3 rounded-2xl text-rose-600"><ShieldAlert size={28} /></div>
                <div>
                   <h4 className="text-rose-900 font-black text-base mb-1">Zona Crítica</h4>
                   <p className="text-rose-800/70 text-xs font-medium leading-relaxed mb-4">Si sospechas que alguien ha accedido a tu cuenta sin permiso, te recomendamos cerrar todas las sesiones activas y cambiar tu contraseña inmediatamente.</p>
                   <button onClick={() => alert("Función disponible pronto en el panel de soporte.")} className="text-rose-600 font-black text-[10px] uppercase tracking-widest hover:underline">Solicitar cierre de sesiones globales</button>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'perfil' && (
          <div className="animate-in fade-in duration-500 max-w-xl">
             {isProfileIncomplete && !isEditingProfile && !showSuccessToast && (
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-[32px] p-6 flex items-start gap-4">
                   <div className="bg-amber-100 p-2.5 rounded-xl text-amber-600 shrink-0"><AlertTriangle size={24} /></div>
                   <div>
                      <h4 className="text-amber-900 font-black text-sm mb-1">Perfil Incompleto para Cobros</h4>
                      <p className="text-amber-800/80 text-xs font-medium leading-relaxed mb-3">
                         Para poder retirar dinero de tus campañas finalizadas, es obligatorio tener tu RUT y Teléfono registrados por seguridad financiera.
                      </p>
                      <button onClick={() => setIsEditingProfile(true)} className="bg-amber-500 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-md shadow-amber-200">Completar ahora</button>
                   </div>
                </div>
             )}
             
             <div className="bg-white rounded-[40px] border border-slate-100 p-10 shadow-sm relative overflow-hidden">
               {!isEditingProfile ? (
                  <>
                     <div className="flex justify-between items-start mb-10">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Tu Perfil</h3>
                        <button onClick={() => setIsEditingProfile(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 hover:text-violet-600 hover:bg-violet-50 rounded-xl font-bold text-xs transition-all"><Edit3 size={16} /> Editar</button>
                     </div>
                     <div className="space-y-6">
                        <div>
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nombre registrado</label>
                           <p className="font-black text-slate-900 p-4 bg-slate-50 rounded-2xl border border-slate-100">{profile?.full_name || 'Sin nombre'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">RUT</label>
                              <div className="font-black text-slate-900 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                 {profile?.rut || <span className="text-slate-400 italic font-medium text-xs">Pendiente</span>}
                                 {!profile?.rut && <AlertTriangle size={14} className="text-amber-500" />}
                              </div>
                           </div>
                           <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Teléfono</label>
                              <div className="font-black text-slate-900 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                 {profile?.phone || <span className="text-slate-400 italic font-medium text-xs">Pendiente</span>}
                                 {!profile?.phone && <AlertTriangle size={14} className="text-amber-500" />}
                              </div>
                           </div>
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Email de contacto</label>
                           <p className="font-bold text-slate-500 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center justify-between">{user?.email}<Lock size={14} className="text-slate-300" /></p>
                        </div>
                        <div className="pt-6 border-t border-slate-50"><button onClick={() => signOut()} className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl font-black hover:bg-rose-100 transition-all">Cerrar Sesión</button></div>
                     </div>
                  </>
               ) : (
                  <div className="animate-in fade-in zoom-in-95 duration-300">
                     <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Editando Información</h3>
                        <button onClick={() => setIsEditingProfile(false)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900"><X size={20} /></button>
                     </div>
                     <div className="space-y-5">
                        <div>
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Nombre Completo</label>
                           <input type="text" className="w-full p-4 bg-white border-2 border-slate-100 focus:border-violet-200 focus:bg-slate-50 rounded-2xl outline-none font-bold text-slate-900 transition-all" value={profileForm.full_name} onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})} placeholder="Tu nombre legal" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">RUT</label>
                              <input type="text" className={`w-full p-4 bg-white border-2 ${rutError ? 'border-rose-200 bg-rose-50' : 'border-slate-100 focus:border-violet-200 focus:bg-slate-50'} rounded-2xl outline-none font-bold text-slate-900 transition-all`} value={profileForm.rut} onChange={handleRutChange} placeholder="12.345.678-9" maxLength={12} />
                           </div>
                           <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Teléfono</label>
                              <input type="text" className={`w-full p-4 bg-white border-2 ${phoneError ? 'border-rose-200 bg-rose-50' : 'border-slate-100 focus:border-violet-200 focus:bg-slate-50'} rounded-2xl outline-none font-bold text-slate-900 transition-all`} value={profileForm.phone} onChange={handlePhoneChange} onBlur={handlePhoneBlur} placeholder="+56 9..." maxLength={15} />
                           </div>
                        </div>
                        <div className="pt-4 flex gap-3">
                           <button onClick={() => setIsEditingProfile(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-all">Cancelar</button>
                           <button onClick={handleUpdateProfile} disabled={profileSaving || !!rutError || !!phoneError} className="flex-[2] py-4 bg-violet-600 text-white rounded-2xl font-black hover:bg-violet-700 transition-all flex items-center justify-center gap-2">
                              {profileSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />} Guardar Cambios
                           </button>
                        </div>
                     </div>
                  </div>
               )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
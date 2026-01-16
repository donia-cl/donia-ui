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
  X
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
  const [financials, setFinancials] = useState<FinancialSummary | null>(null);
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

  // Sincronizar formulario con el perfil cuando este cargue
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

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const formatted = formatRut(val);
    setProfileForm(prev => ({ ...prev, rut: formatted }));
    
    if (val.length > 2 && !validateRut(formatted)) {
      setRutError('RUT inválido');
    } else {
      setRutError(null);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!/^[0-9+\s]*$/.test(val)) return;
    setProfileForm(prev => ({ ...prev, phone: val }));
    if (val.length > 8 && !validateChileanPhone(val)) {
        setPhoneError('Formato: +56 9 XXXXXXXX');
    } else {
        setPhoneError(null);
    }
  };

  const handlePhoneBlur = () => {
    const formatted = formatPhone(profileForm.phone);
    setProfileForm(prev => ({ ...prev, phone: formatted }));
    if (!validateChileanPhone(formatted) && formatted.length > 0) {
        setPhoneError('Número inválido');
    } else {
        setPhoneError(null);
    }
  }

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    if (profileForm.rut && !validateRut(profileForm.rut)) {
        alert("El RUT ingresado no es válido.");
        return;
    }
    if (profileForm.phone && !validateChileanPhone(profileForm.phone)) {
        alert("El teléfono debe ser un móvil chileno válido (+56 9...).");
        return;
    }

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
      console.error("Error updating profile:", e);
      alert("Error actualizando perfil. Intenta nuevamente.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleDelete = async (campaign: CampaignData) => {
    if (campaign.recaudado > 0) {
      alert("No se puede eliminar una campaña que ya ha recibido donaciones.");
      return;
    }
    if (!window.confirm('¿Eliminar esta campaña?')) return;
    
    try {
      const success = await service.deleteCampaign(campaign.id, user!.id);
      if (success) {
        setCampaigns(prev => prev.filter(c => c.id !== campaign.id));
      }
    } catch (e) {
      console.error("Error delete:", e);
    }
  };

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/campana/${id}`;
    navigator.clipboard.writeText(url);
    alert("¡Enlace copiado!");
  };

  const downloadReceipt = (donation: Donation) => {
    alert(`Descargando comprobante para donación #${donation.id.slice(0,8)}...`);
  };

  const isProfileIncomplete = !profile?.rut || !profile?.phone;
  
  const dashboardName = profile?.full_name || user?.user_metadata?.full_name || 'Usuario';
  const dashboardInitial = dashboardName.charAt(0).toUpperCase();

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="w-10 h-10 text-violet-600 animate-spin mb-4" />
        <span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Cargando tu panel...</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/50 min-h-screen pb-20">
      <div className="bg-white border-b border-slate-100 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-slate-900 text-white rounded-[24px] flex items-center justify-center text-2xl font-black shadow-2xl shadow-slate-200">
                {dashboardInitial}
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mi Panel de Control</p>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                  Hola, {dashboardName.split(' ')[0]}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/crear" className="bg-violet-600 text-white px-6 py-4 rounded-2xl font-black hover:bg-violet-700 transition-all flex items-center gap-2 shadow-xl shadow-violet-100">
                <Plus size={20} /> Nueva Campaña
              </Link>
            </div>
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
                className={`flex items-center gap-2 pb-4 text-xs font-black transition-all border-b-2 uppercase tracking-widest whitespace-nowrap relative ${
                  activeTab === tab.id 
                  ? 'border-violet-600 text-violet-600' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
                {tab.id === 'perfil' && isProfileIncomplete && (
                   <span className="absolute -top-1 -right-2 w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                )}
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
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                  <Banknote size={120} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-70">Total Recaudado Histórico</p>
                <p className="text-5xl font-black tracking-tight">${financials?.totalRecaudado.toLocaleString('es-CL')}</p>
                <div className="mt-8 flex items-center gap-2 text-xs font-bold bg-white/10 w-fit px-3 py-1.5 rounded-full">
                  <ArrowUpRight size={14} /> Gestión activa
                </div>
              </div>

              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Campañas</p>
                 <p className="text-4xl font-black text-slate-900">{campaigns.length}</p>
                 <p className="text-xs text-slate-400 font-bold mt-2">En curso</p>
                 <div className="absolute bottom-6 right-6 text-violet-100 group-hover:text-violet-200 transition-colors">
                    <Heart size={40} className="fill-current" />
                 </div>
              </div>

              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Impacto</p>
                 <p className="text-4xl font-black text-slate-900">{campaigns.reduce((acc, c) => acc + c.donantesCount, 0)}</p>
                 <p className="text-xs text-slate-400 font-bold mt-2">Donantes totales</p>
                 <div className="absolute bottom-6 right-6 text-sky-100 group-hover:text-sky-200 transition-colors">
                    <Users size={40} className="fill-current" />
                 </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Tus Historias</h2>
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
                          <span>• {c.categoria}</span>
                       </div>
                       <div className="mt-4 flex items-center gap-4">
                          <div className="flex-grow h-2 bg-slate-50 rounded-full overflow-hidden">
                             <div className="h-full bg-violet-600 rounded-full" style={{ width: `${(c.recaudado/c.monto)*100}%` }} />
                          </div>
                          <span className="text-xs font-black text-slate-700">${c.recaudado.toLocaleString('es-CL')} / ${c.monto.toLocaleString('es-CL')}</span>
                       </div>
                    </div>
                    <div className="flex gap-2 shrink-0 w-full md:w-auto">
                       <button onClick={() => copyLink(c.id)} className="flex-1 md:flex-none p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl transition-colors" title="Copiar enlace"><Copy size={18} /></button>
                       <Link to={`/campana/${c.id}`} className="flex-1 md:flex-none p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl transition-colors" title="Ver pública"><Eye size={18} /></Link>
                       <Link to={`/campana/${c.id}/editar`} className="flex-1 md:flex-none p-3 bg-violet-50 text-violet-600 hover:bg-violet-600 hover:text-white rounded-xl transition-all shadow-sm" title="Editar"><Edit3 size={18} /></Link>
                       <button onClick={() => handleDelete(c)} className="flex-1 md:flex-none p-3 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all shadow-sm" title="Eliminar"><Trash2 size={18} /></button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <Heart size={32} />
                    </div>
                    <p className="text-slate-400 font-bold mb-6">Aún no has creado ninguna campaña.</p>
                    <Link to="/crear" className="bg-violet-600 text-white px-8 py-4 rounded-2xl font-black inline-flex items-center gap-2 shadow-lg shadow-violet-100">
                      ¡Comenzar ahora! <ArrowRight size={18} />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'donaciones' && (
          <div className="animate-in slide-in-from-right-4 duration-500 space-y-6">
             <div className="bg-sky-50 p-8 rounded-[40px] border border-sky-100 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-sky-900 tracking-tight mb-2">Mi Impacto</h2>
                  <p className="text-sky-700 font-medium text-sm">Gracias por ser parte del cambio. Aquí está el historial de tu generosidad.</p>
                </div>
                <div className="text-right hidden md:block">
                  <p className="text-[10px] font-black uppercase tracking-widest text-sky-600 mb-1">Total Donado</p>
                  <p className="text-4xl font-black text-sky-900">${donations.reduce((acc, d) => acc + (d.status !== 'refunded' ? d.monto : 0), 0).toLocaleString('es-CL')}</p>
                </div>
             </div>

             <div className="space-y-4">
               {donations.length > 0 ? donations.map(d => (
                 <div key={d.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-6 group hover:border-violet-100 transition-all">
                    <div className="w-full md:w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-slate-100 relative">
                       {d.campaign?.imagenUrl ? (
                         <img src={d.campaign.imagenUrl} className="w-full h-full object-cover" alt="" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-slate-300"><Heart size={24} /></div>
                       )}
                    </div>
                    
                    <div className="flex-grow w-full">
                       <div className="flex justify-between items-start mb-1">
                          <Link to={`/campana/${d.campaignId}`} className="font-black text-slate-900 text-lg hover:text-violet-600 transition-colors line-clamp-1">
                            {d.campaign?.titulo || 'Campaña no disponible'}
                          </Link>
                          {d.status === 'completed' && (
                            <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                              Confirmada
                            </span>
                          )}
                          {d.status === 'refunded' && (
                            <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">
                              Reembolsada
                            </span>
                          )}
                          {d.status === 'pending' && (
                            <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100">
                              Procesando
                            </span>
                          )}
                       </div>
                       <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                          <span>{new Date(d.fecha).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                          <span>ID: {d.id.slice(0, 8)}</span>
                       </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 md:gap-2 border-t md:border-t-0 border-slate-50 pt-4 md:pt-0">
                       <p className={`text-xl font-black ${d.status === 'refunded' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                         ${d.monto.toLocaleString('es-CL')}
                       </p>
                       
                       <div className="flex gap-2">
                          <button 
                            onClick={() => downloadReceipt(d)}
                            className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all" 
                            title="Descargar Comprobante"
                          >
                             <Download size={18} />
                          </button>
                          <a 
                            href="mailto:soporte@donia.cl"
                            className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all" 
                            title="Ayuda con esta donación"
                          >
                             <HelpCircle size={18} />
                          </a>
                       </div>
                    </div>
                 </div>
               )) : (
                 <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
                    <HeartHandshake size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 font-bold mb-6">Aún no has realizado donaciones con esta cuenta.</p>
                    <Link to="/explorar" className="text-violet-600 font-black hover:underline">Explorar causas para apoyar</Link>
                 </div>
               )}
             </div>

             <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex gap-4 items-start">
                <AlertOctagon className="text-amber-500 shrink-0 mt-1" size={20} />
                <div>
                   <h4 className="font-black text-amber-800 text-sm mb-1">Política de Devoluciones</h4>
                   <p className="text-xs text-amber-700/80 leading-relaxed font-medium">
                     Si detectas una irregularidad en una campaña apoyada, contáctanos inmediatamente. Donia puede congelar fondos y procesar reembolsos directamente a tu medio de pago original si la campaña infringe nuestros términos de servicio.
                   </p>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'finanzas' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-emerald-50 p-10 rounded-[40px] border border-emerald-100 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-6 text-emerald-200/50 group-hover:scale-110 transition-transform">
                      <Wallet size={120} />
                   </div>
                   <div className="relative z-10">
                      <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-4">Disponible para Retiro</p>
                      <p className="text-5xl font-black text-emerald-900 tracking-tighter mb-8">${financials?.disponibleRetiro.toLocaleString('es-CL')}</p>
                      <button className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center gap-2">
                        <ArrowDownToLine size={20} /> Solicitar Retiro
                      </button>
                   </div>
                </div>
                <div className="bg-slate-900 p-10 rounded-[40px] text-white relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-6 text-slate-800 group-hover:scale-110 transition-transform">
                      <History size={120} />
                   </div>
                   <div className="relative z-10">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Total Retirado</p>
                      <p className="text-5xl font-black tracking-tighter mb-8">${financials?.totalRetirado.toLocaleString('es-CL')}</p>
                      <p className="text-slate-400 font-bold text-sm flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-500" /> Historial al día
                      </p>
                   </div>
                </div>
             </div>
             
             <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                   <h3 className="text-xl font-black text-slate-900 tracking-tight">Movimientos Recientes</h3>
                   <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
                      <Info size={18} />
                   </div>
                </div>
                <div className="divide-y divide-slate-50">
                   {withdrawals.length > 0 ? withdrawals.map(w => (
                     <div key={w.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                              <History size={18} />
                           </div>
                           <div>
                              <p className="font-black text-slate-900 text-sm">Retiro de Fondos</p>
                              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{new Date(w.fecha).toLocaleDateString('es-CL')}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="font-black text-slate-900 text-sm">-${w.monto.toLocaleString('es-CL')}</p>
                           <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">{w.estado}</span>
                        </div>
                     </div>
                   )) : (
                     <div className="p-20 text-center text-slate-300 font-bold italic">No hay retiros registrados aún.</div>
                   )}
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
                  <p className="text-slate-500 font-medium">Gestión de acceso y protección de fondos.</p>
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
                <div className="p-6 bg-white rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Smartphone size={20} className="text-slate-400" />
                    <div>
                      <p className="font-black text-slate-900 text-sm">Autenticación 2FA</p>
                      <p className="text-xs text-slate-400 font-medium">Recomendado</p>
                    </div>
                  </div>
                  <button className="text-violet-600 font-black text-xs uppercase tracking-widest hover:underline">Activar</button>
                </div>
                <div className="mt-8 p-6 bg-sky-50 rounded-2xl flex gap-3 items-start border border-sky-100">
                   <Lock size={18} className="text-sky-600 mt-1" />
                   <p className="text-xs text-sky-900 font-bold leading-relaxed">Tus datos y fondos están protegidos mediante cifrado AES-256. Donia nunca solicita tus claves por correo o SMS.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'perfil' && (
          <div className="animate-in fade-in duration-500 max-w-xl">
             {isProfileIncomplete && !isEditingProfile && !showSuccessToast && (
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-[32px] p-6 flex items-start gap-4">
                   <div className="bg-amber-100 p-2.5 rounded-xl text-amber-600 shrink-0">
                      <AlertTriangle size={24} />
                   </div>
                   <div>
                      <h4 className="text-amber-900 font-black text-sm mb-1">Perfil Incompleto</h4>
                      <p className="text-amber-800/80 text-xs font-medium leading-relaxed mb-3">
                         Para crear campañas de manera segura y gestionar retiros, necesitamos completar tu RUT y teléfono de contacto.
                      </p>
                      <button 
                         onClick={() => setIsEditingProfile(true)}
                         className="bg-amber-500 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-600 transition-colors shadow-md shadow-amber-200"
                      >
                         Completar ahora
                      </button>
                   </div>
                </div>
             )}

             {showSuccessToast && (
                <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-[32px] p-6 flex items-center gap-4 animate-in slide-in-from-top-2">
                    <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-600 shrink-0">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <h4 className="text-emerald-900 font-black text-sm mb-1">¡Perfil actualizado!</h4>
                      <p className="text-emerald-800/80 text-xs font-medium">Tus datos se han guardado correctamente.</p>
                    </div>
                    <button onClick={() => setShowSuccessToast(false)} className="ml-auto text-emerald-500 hover:text-emerald-700">
                      <X size={20} />
                    </button>
                </div>
             )}

            <div className="bg-white rounded-[40px] border border-slate-100 p-10 shadow-sm relative overflow-hidden">
               {!isEditingProfile ? (
                  <>
                     <div className="flex justify-between items-start mb-10">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Tu Perfil</h3>
                        <button 
                           onClick={() => setIsEditingProfile(true)}
                           className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 hover:text-violet-600 hover:bg-violet-50 rounded-xl font-bold text-xs transition-all"
                        >
                           <Edit3 size={16} /> Editar
                        </button>
                     </div>

                     <div className="space-y-6">
                        <div>
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nombre registrado</label>
                           <p className="font-black text-slate-900 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              {profile?.full_name || 'Sin nombre'}
                           </p>
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
                           <p className="font-bold text-slate-500 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center justify-between">
                              {user?.email}
                              <Lock size={14} className="text-slate-300" />
                           </p>
                        </div>

                        <div className="pt-6 border-t border-slate-50">
                           <button onClick={() => signOut()} className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl font-black hover:bg-rose-100 transition-all flex items-center justify-center gap-2">
                              Cerrar Sesión
                           </button>
                        </div>
                     </div>
                  </>
               ) : (
                  <div className="animate-in fade-in zoom-in-95 duration-300">
                     <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Editando Información</h3>
                        <button 
                           onClick={() => setIsEditingProfile(false)}
                           className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
                        >
                           <X size={20} />
                        </button>
                     </div>

                     <div className="space-y-5">
                        <div>
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Nombre Completo</label>
                           <input
                              type="text"
                              className="w-full p-4 bg-white border-2 border-slate-100 focus:border-violet-200 focus:bg-slate-50 rounded-2xl outline-none font-bold text-slate-900 transition-all"
                              value={profileForm.full_name}
                              onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
                              placeholder="Tu nombre legal"
                           />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">RUT</label>
                              <input
                                 type="text"
                                 className={`w-full p-4 bg-white border-2 ${rutError ? 'border-rose-200 bg-rose-50' : 'border-slate-100 focus:border-violet-200 focus:bg-slate-50'} rounded-2xl outline-none font-bold text-slate-900 transition-all`}
                                 value={profileForm.rut}
                                 onChange={handleRutChange}
                                 placeholder="12.345.678-9"
                                 maxLength={12}
                              />
                              {rutError && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{rutError}</p>}
                           </div>
                           <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Teléfono</label>
                              <input
                                 type="text"
                                 className={`w-full p-4 bg-white border-2 ${phoneError ? 'border-rose-200 bg-rose-50' : 'border-slate-100 focus:border-violet-200 focus:bg-slate-50'} rounded-2xl outline-none font-bold text-slate-900 transition-all`}
                                 value={profileForm.phone}
                                 onChange={handlePhoneChange}
                                 onBlur={handlePhoneBlur}
                                 placeholder="+56 9..."
                                 maxLength={15}
                              />
                              {phoneError && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{phoneError}</p>}
                           </div>
                        </div>

                        <div className="bg-sky-50 p-4 rounded-2xl border border-sky-100 flex gap-3 mt-4">
                           <Info size={20} className="text-sky-600 shrink-0 mt-0.5" />
                           <p className="text-xs text-sky-800 font-medium leading-relaxed">
                              La información proporcionada será utilizada para verificar tu identidad al momento de solicitar retiros. Tu teléfono quedará pendiente de validación vía código (próximamente).
                           </p>
                        </div>

                        <div className="pt-4 flex gap-3">
                           <button 
                              onClick={() => setIsEditingProfile(false)}
                              className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-all"
                           >
                              Cancelar
                           </button>
                           <button 
                              onClick={handleUpdateProfile}
                              disabled={profileSaving || !!rutError || !!phoneError}
                              className="flex-[2] py-4 bg-violet-600 text-white rounded-2xl font-black hover:bg-violet-700 transition-all shadow-xl shadow-violet-100 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                           >
                              {profileSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                              Guardar Cambios
                           </button>
                        </div>
                     </div>
                  </div>
               )}
            </div>
          </div>
        )}

      </div>
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
};

export default Dashboard;
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ChevronLeft, 
  CheckCircle, 
  Edit, 
  Tag, 
  HeartHandshake, 
  AlertCircle, 
  RefreshCcw, 
  ShieldCheck, 
  UserCheck, 
  Database,
  Lock,
  Loader2,
  Check,
  FileText,
  Image as ImageIcon,
  Clock,
  X,
  Mail,
  User,
  ArrowRight,
  Wallet,
  Edit3
} from 'lucide-react';
import { useCampaign } from '../../context/CampaignContext';
import { useAuth } from '../../context/AuthContext';
import { ProgressBar } from '../../components/ProgressBar';
import { CampaignService } from '../../services/CampaignService';
import { AuthService } from '../../services/AuthService';

const ReviewItem = ({ icon: Icon, label, value, onEdit }: { icon: any, label: string, value: string | number, onEdit: () => void }) => (
  <div className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0 group">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-violet-600 transition-colors">
        <Icon size={16} />
      </div>
      <div>
        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</span>
        <p className="text-slate-800 font-bold text-sm leading-tight">{value}</p>
      </div>
    </div>
    <button 
      onClick={onEdit}
      className="p-1.5 text-violet-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all"
    >
      <Edit size={14} />
    </button>
  </div>
);

const VistoBuenoCheckbox = ({ checked, onChange, label }: { checked: boolean, onChange: (val: boolean) => void, label: string }) => (
  <label className="flex items-center gap-4 cursor-pointer group py-4 px-6 bg-white border border-slate-100 rounded-2xl hover:border-violet-200 hover:bg-violet-50/30 transition-all shadow-sm w-full">
    <div className="relative shrink-0">
      <input
        type="checkbox"
        className="peer hidden"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className="w-6 h-6 border-2 border-slate-200 rounded-full bg-white peer-checked:bg-violet-600 peer-checked:border-violet-600 transition-all flex items-center justify-center shadow-inner">
        <Check className="w-3.5 h-3.5 text-white scale-0 peer-checked:scale-100 transition-transform duration-200" strokeWidth={4} />
      </div>
    </div>
    <span className={`text-xs font-bold transition-colors select-none ${checked ? 'text-slate-900' : 'text-slate-500'}`}>
      {label}
    </span>
  </label>
);

// --- AUTH MODAL COMPONENT (UPDATED) ---
const AuthModal = ({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) => {
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  
  const [formData, setFormData] = useState({ email: '', password: '', fullName: '' });
  
  const authService = AuthService.getInstance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await authService.signIn(formData.email, formData.password);
      } else {
        await authService.signUp(formData.email, formData.password, formData.fullName);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Error de autenticación.");
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    // Guardamos la ubicación actual limpia (sin hash #) para volver tras la autenticación de Google
    localStorage.setItem('donia_auth_redirect', location.pathname + location.search);
    
    setGoogleLoading(true);
    try {
      await authService.signInWithGoogle();
    } catch (err: any) {
      setError("No se pudo conectar con Google.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-colors z-10">
          <X size={20} />
        </button>

        <div className="p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-violet-600 text-white rounded-[24px] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-violet-200">
              <Lock size={28} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {isLogin ? 'Bienvenido de vuelta' : 'Antes de publicar...'}
            </h3>
            <p className="text-slate-500 font-medium text-sm mt-2 leading-relaxed">
              Crea una cuenta para gestionar y retirar tus fondos de manera segura.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700 text-xs font-bold">
              <AlertCircle size={16} />
              <p>{error}</p>
            </div>
          )}

          <button
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="w-full py-3.5 px-6 bg-white border-2 border-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-center gap-3 mb-6 text-sm"
          >
            {googleLoading ? <Loader2 className="animate-spin text-violet-600" size={18} /> : (
              <>
                 <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                 Continuar con Google
              </>
            )}
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-slate-300"><span className="bg-white px-2">o con email</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="text"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-2xl outline-none font-bold text-slate-900 text-sm transition-all"
                  placeholder="Nombre completo"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                type="email"
                required
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-2xl outline-none font-bold text-slate-900 text-sm transition-all"
                placeholder="Correo electrónico"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                type="password"
                required
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-2xl outline-none font-bold text-slate-900 text-sm transition-all"
                placeholder="Contraseña"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-4 bg-violet-600 text-white rounded-2xl font-black text-base hover:bg-violet-700 shadow-xl flex items-center justify-center gap-2 group disabled:opacity-50 mt-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  {isLogin ? 'Ingresar y Publicar' : 'Crear Cuenta y Publicar'} 
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-xs font-medium text-slate-500">
            {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
            <button onClick={() => setIsLogin(!isLogin)} className="ml-1 text-violet-600 font-black hover:underline">
              {isLogin ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

const CreateReview: React.FC = () => {
  const navigate = useNavigate();
  const { campaign, resetCampaign } = useCampaign();
  const { user } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [declarations, setDeclarations] = useState({
    veraz: false,
    verificacion: false,
    pausar: false
  });

  const service = CampaignService.getInstance();

  const handlePublishClick = () => {
    if (!declarations.veraz || !declarations.verificacion || !declarations.pausar) {
      setError("Debes aceptar todas las declaraciones de compromiso para continuar.");
      return;
    }

    if (!user) {
      setShowAuthModal(true);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    // Obtener sesión fresca para evitar estados "stale"
    const session = await AuthService.getInstance().getSession();
    const currentUser = session?.user;

    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const result = await service.createCampaign({
        titulo: campaign.titulo || '',
        historia: campaign.historia || '',
        monto: campaign.monto || 0,
        categoria: campaign.categoria || 'Varios',
        ubicacion: campaign.ubicacion || 'Chile',
        imagenUrl: campaign.imagenUrl || '',
        beneficiarioNombre: campaign.beneficiarioNombre || '',
        beneficiarioRelacion: campaign.beneficiarioRelacion || 'Yo mismo',
        duracionDias: campaign.duracionDias || 60,
        owner_id: currentUser.id 
      });
      
      if (result && result.id) {
        setIsSuccess(true);
      } else {
        throw new Error("El servidor no pudo procesar la solicitud.");
      }
    } catch (err: any) {
      console.error("Error al publicar:", err);
      setError(err.message || "Error al conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-32 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-[24px] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-100">
          <CheckCircle size={32} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">¡Campaña publicada!</h1>
        <p className="text-slate-500 text-base mb-8 font-medium leading-relaxed">
          Tu historia ha sido guardada exitosamente y ya está disponible en Donia para recibir apoyo.
        </p>
        <button 
          onClick={() => {
            resetCampaign();
            navigate('/dashboard');
          }}
          className="bg-slate-900 text-white px-8 py-3.5 rounded-xl font-black text-base hover:bg-slate-800 shadow-xl transition-all active:scale-95"
        >
          Ir a mi panel
        </button>
      </div>
    );
  }

  const isSchemaError = error?.includes("user_id") || error?.includes("schema cache");
  const allChecked = declarations.veraz && declarations.verificacion && declarations.pausar;

  return (
    <>
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          onSuccess={() => {
            setShowAuthModal(false);
            // Pequeña espera para que el contexto de Auth se actualice internamente
            setTimeout(() => handleSubmit(), 500); 
          }} 
        />
      )}

      <div className="max-w-4xl mx-auto px-4 py-10">
        <ProgressBar currentStep={4} totalSteps={4} />

        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-slate-400 hover:text-violet-600 mb-6 transition-colors font-black text-[10px] uppercase tracking-widest">
          <ChevronLeft size={14} /> Volver
        </button>

        <div className="text-center mb-10">
          <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Revisa tu campaña</h1>
          <p className="text-slate-500 font-medium text-sm">Confirma que todo esté correcto antes de lanzar tu historia.</p>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-4">
                 <Tag size={16} className="text-violet-600" />
                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Detalles principales</h3>
              </div>
              <div className="space-y-1">
                <ReviewItem 
                  icon={Tag}
                  label="Título de la causa"
                  value={campaign.titulo || ''}
                  onEdit={() => navigate('/crear/detalles')}
                />
                <ReviewItem 
                  icon={HeartHandshake}
                  label="Monto Objetivo"
                  value={`$${campaign.monto?.toLocaleString('es-CL')} CLP`}
                  onEdit={() => navigate('/crear/detalles')}
                />
                <ReviewItem 
                  icon={UserCheck}
                  label="Beneficiario"
                  value={`${campaign.beneficiarioNombre} (${campaign.beneficiarioRelacion})`}
                  onEdit={() => navigate('/crear/detalles')}
                />
                <ReviewItem 
                  icon={Clock}
                  label="Duración"
                  value={`${campaign.duracionDias} Días`}
                  onEdit={() => navigate('/crear/detalles')}
                />
              </div>
            </div>

            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden group relative aspect-video lg:aspect-auto">
              {campaign.imagenUrl ? (
                <img src={campaign.imagenUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Portada" />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold">Sin Imagen</div>
              )}
              <div className="absolute top-4 left-4">
                 <span className="bg-violet-600/90 backdrop-blur-sm text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                   {campaign.categoria}
                 </span>
              </div>
              <button 
                onClick={() => navigate('/crear/detalles')}
                className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm text-slate-900 p-2.5 rounded-xl shadow-xl hover:bg-white transition-all hover:scale-110"
              >
                <ImageIcon size={18} />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-violet-600" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tu historia</h3>
              </div>
              <button 
                onClick={() => navigate('/crear/historia')}
                className="text-violet-600 font-black text-[10px] uppercase tracking-widest hover:underline"
              >
                Editar relato
              </button>
            </div>
            <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-50">
              <p className="text-slate-600 leading-relaxed text-sm italic font-medium whitespace-pre-wrap">
                {campaign.historia || 'Sin historia definida.'}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-[32px] p-8 md:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-100/30 rounded-bl-full pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 bg-violet-600 text-white rounded-lg flex items-center justify-center shadow-lg">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">Compromiso de Transparencia</h2>
                  <p className="text-slate-500 font-medium text-[11px]">Por favor, firma tu compromiso para poder publicar.</p>
                </div>
              </div>

              <div className="space-y-3">
                <VistoBuenoCheckbox 
                  checked={declarations.veraz}
                  onChange={(val) => setDeclarations({...declarations, veraz: val})}
                  label="Declaro que la información es veraz"
                />
                <VistoBuenoCheckbox 
                  checked={declarations.verificacion}
                  onChange={(val) => setDeclarations({...declarations, verificacion: val})}
                  label="Acepto que Donia puede solicitar verificación"
                />
                <VistoBuenoCheckbox 
                  checked={declarations.pausar}
                  onChange={(val) => setDeclarations({...declarations, pausar: val})}
                  label="Acepto que Donia puede pausar la campaña ante irregularidades"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className={`p-5 ${isSchemaError ? 'bg-amber-50 border-amber-100 text-amber-900' : 'bg-rose-50 border-rose-100 text-rose-900'} border-2 rounded-2xl flex flex-col md:flex-row gap-4 items-center animate-in slide-in-from-top-4 shadow-sm`}>
              <div className={`w-8 h-8 bg-white rounded-lg flex items-center justify-center ${isSchemaError ? 'text-amber-500' : 'text-rose-500'} shadow-sm shrink-0`}>
                {isSchemaError ? <Database size={16} /> : <AlertCircle size={16} />}
              </div>
              <div className="flex-grow text-center md:text-left">
                <p className="font-black text-[9px] uppercase tracking-widest mb-0.5">{isSchemaError ? 'Error de Sistema' : 'Error de validación'}</p>
                <p className="text-[11px] font-bold opacity-80">{error}</p>
              </div>
              <button 
                onClick={handleSubmit}
                className={`flex items-center gap-2 ${isSchemaError ? 'bg-amber-500' : 'bg-rose-500'} text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all shadow-md`}
              >
                <RefreshCcw size={12} /> Reintentar
              </button>
            </div>
          )}

          {!isSuccess && (
            <button 
              onClick={handlePublishClick}
              disabled={isSubmitting || !allChecked}
              className={`w-full py-6 rounded-[24px] font-black text-xl transition-all flex items-center justify-center gap-3 shadow-2xl relative overflow-hidden group ${
                isSubmitting || !allChecked
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none' 
                : 'bg-violet-600 text-white hover:bg-violet-700 shadow-violet-100 active:scale-95'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  Publicando...
                </>
              ) : (
                <>
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                  <Lock size={18} className={allChecked ? 'text-violet-200' : 'text-slate-300'} />
                  <span>{user ? 'Lanzar mi campaña' : 'Ingresar y Publicar'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default CreateReview;
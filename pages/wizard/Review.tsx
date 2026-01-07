
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FileText
} from 'lucide-react';
import { useCampaign } from '../../context/CampaignContext';
import { useAuth } from '../../context/AuthContext';
import { ProgressBar } from '../../components/ProgressBar';
import { CampaignService } from '../../services/CampaignService';

const ReviewItem = ({ icon: Icon, label, value, onEdit }: { icon: any, label: string, value: string | number, onEdit: () => void }) => (
  <div className="flex justify-between items-center py-4 border-b border-slate-50 last:border-0 group">
    <div className="flex items-center gap-4">
      <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-violet-600 transition-colors">
        <Icon size={18} />
      </div>
      <div>
        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</span>
        <p className="text-slate-800 font-bold text-base leading-tight">{value}</p>
      </div>
    </div>
    <button 
      onClick={onEdit}
      className="p-2 text-violet-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all"
    >
      <Edit size={16} />
    </button>
  </div>
);

const VistoBuenoCheckbox = ({ checked, onChange, label }: { checked: boolean, onChange: (val: boolean) => void, label: string }) => (
  <label className="flex items-center gap-3 cursor-pointer group py-3 px-5 bg-white border border-slate-100 rounded-xl hover:border-violet-200 hover:bg-violet-50/20 transition-all shadow-sm">
    <div className="relative shrink-0">
      <input
        type="checkbox"
        className="peer hidden"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className="w-6 h-6 border-2 border-slate-200 rounded-full bg-white peer-checked:bg-violet-600 peer-checked:border-violet-600 transition-all flex items-center justify-center">
        <Check className="w-3 h-3 text-white scale-0 peer-checked:scale-100 transition-transform duration-200" strokeWidth={4} />
      </div>
    </div>
    <span className={`text-xs font-bold transition-colors select-none ${checked ? 'text-slate-900' : 'text-slate-500'}`}>
      {label}
    </span>
  </label>
);

const CreateReview: React.FC = () => {
  const navigate = useNavigate();
  const { campaign, resetCampaign } = useCampaign();
  const { user } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [declarations, setDeclarations] = useState({
    veraz: false,
    verificacion: false,
    pausar: false
  });

  const service = CampaignService.getInstance();

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!user) {
      setError("Debes estar autenticado para publicar una campaña.");
      return;
    }

    if (!declarations.veraz || !declarations.verificacion || !declarations.pausar) {
      setError("Debes aceptar todas las declaraciones de compromiso para continuar.");
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
        user_id: user.id
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
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[28px] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-100">
          <CheckCircle size={48} />
        </div>
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">¡Campaña publicada!</h1>
        <p className="text-slate-500 text-lg mb-10 font-medium leading-relaxed">
          Tu historia ha sido guardada exitosamente y ya está disponible en Donia para recibir apoyo.
        </p>
        <button 
          onClick={() => {
            resetCampaign();
            navigate('/dashboard');
          }}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-slate-800 shadow-2xl transition-all active:scale-95"
        >
          Ir a mi panel
        </button>
      </div>
    );
  }

  const isSchemaError = error?.includes("user_id") || error?.includes("schema cache");
  const allChecked = declarations.veraz && declarations.verificacion && declarations.pausar;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <ProgressBar currentStep={4} totalSteps={4} />

      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-slate-400 hover:text-violet-600 mb-8 transition-colors font-black text-xs uppercase tracking-widest">
        <ChevronLeft size={16} /> Volver
      </button>

      <div className="text-center mb-12">
        <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Revisa tu campaña</h1>
        <p className="text-slate-500 font-medium text-base">Esta es la vista previa final antes de que tu historia llegue a la comunidad.</p>
      </div>

      <div className="space-y-8 mb-12">
        {/* FILA 1: IMAGEN DE PORTADA */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-md overflow-hidden group">
          <div className="aspect-video relative">
            <img src={campaign.imagenUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Portada" />
            <div className="absolute top-6 left-6 flex gap-2">
               <span className="bg-violet-600 text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                 {campaign.categoria}
               </span>
            </div>
            <button 
              onClick={() => navigate('/crear/detalles')}
              className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm text-slate-900 p-3 rounded-2xl shadow-xl hover:bg-white transition-all hover:scale-110"
            >
              <Edit size={20} />
            </button>
          </div>
        </div>

        {/* FILA 2: INFORMACIÓN DE LA CAMPAÑA */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-lg p-8 md:p-10">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-4">
             <Tag size={18} className="text-violet-600" />
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Detalles principales</h3>
          </div>
          <div className="space-y-2">
            <ReviewItem 
              icon={Tag}
              label="Título de la campaña"
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
              label="Beneficiario Directo"
              value={`${campaign.beneficiarioNombre} (${campaign.beneficiarioRelacion})`}
              onEdit={() => navigate('/crear/detalles')}
            />
          </div>
        </div>

        {/* FILA 3: EL RELATO COMPLETO */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-lg p-8 md:p-10">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <FileText size={18} className="text-violet-600" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tu historia</h3>
            </div>
            <button 
              onClick={() => navigate('/crear/historia')}
              className="text-violet-600 font-black text-[10px] uppercase tracking-widest hover:underline"
            >
              Editar relato
            </button>
          </div>
          <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-50">
            <p className="text-slate-600 leading-relaxed text-base italic font-medium whitespace-pre-wrap">
              {campaign.historia}
            </p>
          </div>
        </div>

        {/* FILA 4: COMPROMISOS (CHECKBOXES) */}
        <div className="bg-slate-50 border border-slate-200 rounded-[32px] p-8 md:p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-100/40 rounded-bl-full pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 bg-violet-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-violet-100">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Compromiso de Transparencia</h2>
                <p className="text-slate-500 font-medium text-xs">Por favor, valida los siguientes puntos para poder publicar.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <VistoBuenoCheckbox 
                checked={declarations.veraz}
                onChange={(val) => setDeclarations({...declarations, veraz: val})}
                label="Info. veraz"
              />
              <VistoBuenoCheckbox 
                checked={declarations.verificacion}
                onChange={(val) => setDeclarations({...declarations, verificacion: val})}
                label="Acepto verificación"
              />
              <VistoBuenoCheckbox 
                checked={declarations.pausar}
                onChange={(val) => setDeclarations({...declarations, pausar: val})}
                label="Acepto pausa"
              />
            </div>
          </div>
        </div>

        {/* Errores de API */}
        {error && (
          <div className={`p-6 ${isSchemaError ? 'bg-amber-50 border-amber-100 text-amber-900' : 'bg-rose-50 border-rose-100 text-rose-900'} border-2 rounded-[28px] flex flex-col md:flex-row gap-5 items-center animate-in slide-in-from-top-4 shadow-sm`}>
            <div className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center ${isSchemaError ? 'text-amber-500' : 'text-rose-500'} shadow-sm shrink-0`}>
              {isSchemaError ? <Database size={20} /> : <AlertCircle size={20} />}
            </div>
            <div className="flex-grow text-center md:text-left">
              <p className="font-black text-[9px] uppercase tracking-widest mb-1">{isSchemaError ? 'Error de Base de Datos' : 'Error de validación'}</p>
              <p className="text-xs font-bold opacity-80">{error}</p>
            </div>
            <button 
              onClick={handleSubmit}
              className={`flex items-center gap-2 ${isSchemaError ? 'bg-amber-500' : 'bg-rose-500'} text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all shadow-md`}
            >
              <RefreshCcw size={14} /> Reintentar
            </button>
          </div>
        )}

        {/* BOTÓN FINAL: LANZAR */}
        {!isSuccess && (
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || !allChecked}
            className={`w-full py-6 rounded-[28px] font-black text-2xl transition-all flex items-center justify-center gap-4 shadow-2xl relative overflow-hidden group ${
              isSubmitting || !allChecked
              ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none' 
              : 'bg-violet-600 text-white hover:bg-violet-700 shadow-violet-100 active:scale-95'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={28} />
                Publicando causa...
              </>
            ) : (
              <>
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                <Lock size={22} className={allChecked ? 'text-violet-200' : 'text-slate-300'} />
                <span>Lanzar mi campaña</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default CreateReview;

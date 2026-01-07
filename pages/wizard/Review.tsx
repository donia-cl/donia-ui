
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
  Check
} from 'lucide-react';
import { useCampaign } from '../../context/CampaignContext';
import { useAuth } from '../../context/AuthContext';
import { ProgressBar } from '../../components/ProgressBar';
import { CampaignService } from '../../services/CampaignService';

const ReviewItem = ({ icon: Icon, label, value, onEdit }: { icon: any, label: string, value: string | number, onEdit: () => void }) => (
  <div className="flex justify-between items-start py-6 border-b border-slate-50 last:border-0 group">
    <div className="flex gap-5">
      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-violet-600 transition-colors">
        <Icon size={20} />
      </div>
      <div>
        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</span>
        <p className="text-slate-900 font-bold text-lg leading-tight">{value}</p>
      </div>
    </div>
    <button 
      onClick={onEdit}
      className="p-2 text-violet-600 hover:bg-violet-50 rounded-xl transition-all"
    >
      <Edit size={18} />
    </button>
  </div>
);

const VistoBuenoCheckbox = ({ checked, onChange, label }: { checked: boolean, onChange: (val: boolean) => void, label: string }) => (
  <label className="flex items-center gap-4 cursor-pointer group py-3 px-6 bg-white border border-slate-100 rounded-2xl hover:border-violet-200 hover:bg-violet-50/30 transition-all shadow-sm">
    <div className="relative shrink-0">
      <input
        type="checkbox"
        className="peer hidden"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className="w-7 h-7 border-2 border-slate-200 rounded-full bg-white peer-checked:bg-violet-600 peer-checked:border-violet-600 transition-all flex items-center justify-center shadow-inner">
        <Check className="w-4 h-4 text-white scale-0 peer-checked:scale-100 transition-transform duration-300" strokeWidth={4} />
      </div>
    </div>
    <span className={`text-sm font-bold transition-colors select-none ${checked ? 'text-slate-900' : 'text-slate-500'}`}>
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
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-lg shadow-emerald-100 animate-bounce">
          <CheckCircle size={56} />
        </div>
        <h1 className="text-5xl font-black text-slate-900 mb-6 tracking-tight">¡Campaña publicada!</h1>
        <p className="text-slate-500 text-xl mb-12 font-medium leading-relaxed">
          Tu historia ha sido guardada exitosamente y ya está disponible en Donia para recibir apoyo.
        </p>
        <button 
          onClick={() => {
            resetCampaign();
            navigate('/dashboard');
          }}
          className="bg-slate-900 text-white px-10 py-5 rounded-[24px] font-black text-xl hover:bg-slate-800 shadow-2xl transition-all active:scale-95"
        >
          Ir a mi panel
        </button>
      </div>
    );
  }

  const isSchemaError = error?.includes("user_id") || error?.includes("schema cache");
  const allChecked = declarations.veraz && declarations.verificacion && declarations.pausar;

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <ProgressBar currentStep={4} totalSteps={4} />

      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-slate-400 hover:text-violet-600 mb-8 transition-colors font-bold">
        <ChevronLeft size={20} /> Volver
      </button>

      <div className="text-center mb-16">
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Casi hemos terminado</h1>
        <p className="text-slate-500 font-medium text-lg">Confirma que toda la información es correcta y firma tu compromiso.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Columna Izquierda: Datos */}
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl p-10 relative overflow-hidden h-fit">
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
        </div>

        {/* Columna Derecha: Imagen y Preview Historia */}
        <div className="space-y-6">
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-lg overflow-hidden h-fit">
             <div className="aspect-video relative">
                <img src={campaign.imagenUrl} className="w-full h-full object-cover" alt="Portada" />
                <div className="absolute top-4 left-4">
                   <span className="bg-violet-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                     {campaign.categoria}
                   </span>
                </div>
             </div>
             <div className="p-6">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Relato (Fragmento)</span>
                <p className="text-slate-600 text-sm leading-relaxed italic line-clamp-3">"{campaign.historia}"</p>
             </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN COMPROMISO: Ancho Completo */}
      <div className="mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-slate-50 border border-slate-200 rounded-[40px] p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-100/50 rounded-bl-full opacity-50"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-violet-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-violet-100">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Compromiso de Transparencia</h2>
                <p className="text-slate-500 font-medium text-sm">Para publicar, debes validar estos tres puntos finales.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <VistoBuenoCheckbox 
                checked={declarations.veraz}
                onChange={(val) => setDeclarations({...declarations, veraz: val})}
                label="Declaro que la información es veraz"
              />
              <VistoBuenoCheckbox 
                checked={declarations.verificacion}
                onChange={(val) => setDeclarations({...declarations, verificacion: val})}
                label="Acepto verificación de Donia"
              />
              <VistoBuenoCheckbox 
                checked={declarations.pausar}
                onChange={(val) => setDeclarations({...declarations, pausar: val})}
                label="Acepto pausa por irregularidades"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Errores de API */}
      {error && (
        <div className={`mb-8 p-6 ${isSchemaError ? 'bg-amber-50 border-amber-100 text-amber-900' : 'bg-rose-50 border-rose-100 text-rose-900'} border-2 rounded-[32px] flex flex-col md:flex-row gap-6 items-center animate-in slide-in-from-top-4 shadow-sm`}>
          <div className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center ${isSchemaError ? 'text-amber-500' : 'text-rose-500'} shadow-sm shrink-0`}>
            {isSchemaError ? <Database size={20} /> : <AlertCircle size={20} />}
          </div>
          <div className="flex-grow text-center md:text-left">
            <p className="font-black text-[10px] uppercase tracking-widest mb-1">{isSchemaError ? 'Error de Base de Datos' : 'Error de validación'}</p>
            <p className="text-xs font-bold opacity-80">{error}</p>
          </div>
          <button 
            onClick={handleSubmit}
            className={`flex items-center gap-2 ${isSchemaError ? 'bg-amber-500' : 'bg-rose-500'} text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-md`}
          >
            <RefreshCcw size={14} /> Reintentar
          </button>
        </div>
      )}

      {/* Botón de Lanzamiento: Ancho Completo */}
      {!isSuccess && (
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting || !allChecked}
          className={`w-full py-8 rounded-[32px] font-black text-3xl transition-all flex items-center justify-center gap-4 shadow-2xl relative overflow-hidden group ${
            isSubmitting || !allChecked
            ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none' 
            : 'bg-violet-600 text-white hover:bg-violet-700 shadow-violet-100 active:scale-95'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={32} />
              Publicando...
            </>
          ) : (
            <>
              <div className={`absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500`}></div>
              <Lock size={28} className={allChecked ? 'text-violet-200' : 'text-slate-300'} />
              <span>Lanzar mi campaña</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default CreateReview;


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
  Loader2
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

const ClassicCheckbox = ({ checked, onChange, label }: { checked: boolean, onChange: (val: boolean) => void, label: string }) => (
  <label className="flex items-start gap-3 cursor-pointer group py-1">
    <div className="relative mt-0.5 shrink-0">
      <input
        type="checkbox"
        className="peer hidden"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className="w-5 h-5 border-2 border-slate-300 rounded-md bg-white peer-checked:bg-violet-600 peer-checked:border-violet-600 transition-all flex items-center justify-center">
        <svg className="w-3 h-3 text-white scale-0 peer-checked:scale-100 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </div>
    </div>
    <span className="text-xs font-bold text-slate-600 leading-tight group-hover:text-slate-900 transition-colors select-none">
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
  
  // States para checkboxes de cumplimiento
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
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Revisa y publica</h1>
        <p className="text-slate-500 font-medium text-lg">Confirma los detalles finales y lanza tu campaña a la comunidad.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl p-10 relative overflow-hidden h-fit">
          {isSubmitting && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-violet-600 animate-spin mb-4" />
              <span className="font-black text-violet-600 uppercase tracking-widest text-sm">Publicando tu historia...</span>
            </div>
          )}

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
            label="Beneficiario Final"
            value={`${campaign.beneficiarioNombre} (${campaign.beneficiarioRelacion})`}
            onEdit={() => navigate('/crear/detalles')}
          />
          
          <div className="py-8 border-t border-slate-50 mt-4">
             <span className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Vista previa del relato</span>
             <div className="bg-slate-50 p-6 rounded-3xl text-slate-600 leading-relaxed text-sm italic font-medium">
               "{campaign.historia?.substring(0, 400)}..."
             </div>
          </div>
        </div>

        <div className="space-y-8 flex flex-col">
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-lg overflow-hidden">
             <div className="aspect-video relative">
                <img src={campaign.imagenUrl} className="w-full h-full object-cover" alt="Portada" />
                <div className="absolute top-4 left-4">
                   <span className="bg-violet-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                     {campaign.categoria}
                   </span>
                </div>
             </div>
             <div className="p-8">
                <h3 className="font-black text-slate-900 mb-2">Imagen de portada</h3>
                <p className="text-slate-400 text-xs font-bold leading-relaxed">Esta es la primera impresión que tendrán tus futuros donantes.</p>
             </div>
          </div>

          <div className="mt-auto space-y-8">
            {/* Declaraciones Juradas Clásicas */}
            <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-200">
               <div className="flex items-center gap-3 mb-6">
                  <ShieldCheck size={20} className="text-sky-600" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Compromiso con la Verdad</h3>
               </div>
               
               <div className="space-y-4">
                  <ClassicCheckbox 
                    checked={declarations.veraz}
                    onChange={(val) => setDeclarations({...declarations, veraz: val})}
                    label="Declaro que la información es veraz"
                  />
                  <ClassicCheckbox 
                    checked={declarations.verificacion}
                    onChange={(val) => setDeclarations({...declarations, verificacion: val})}
                    label="Acepto que Donia puede solicitar verificación"
                  />
                  <ClassicCheckbox 
                    checked={declarations.pausar}
                    onChange={(val) => setDeclarations({...declarations, pausar: val})}
                    label="Acepto que Donia puede pausar la campaña ante irregularidades"
                  />
               </div>
            </div>

            {error && (
              <div className={`p-6 ${isSchemaError ? 'bg-amber-50 border-amber-100 text-amber-900' : 'bg-rose-50 border-rose-100 text-rose-900'} border-2 rounded-[32px] flex flex-col md:flex-row gap-6 items-center animate-in slide-in-from-top-4 shadow-sm`}>
                <div className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center ${isSchemaError ? 'text-amber-500' : 'text-rose-500'} shadow-sm shrink-0`}>
                  {isSchemaError ? <Database size={20} /> : <AlertCircle size={20} />}
                </div>
                <div className="flex-grow text-center md:text-left">
                  <p className="font-black text-[10px] uppercase tracking-widest mb-1">{isSchemaError ? 'Error de Base de Datos' : 'Error de validación'}</p>
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

            {!isSuccess && (
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting || !allChecked}
                className={`w-full py-6 rounded-[28px] font-black text-2xl transition-all flex items-center justify-center gap-3 shadow-2xl ${
                  isSubmitting || !allChecked
                  ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none' 
                  : 'bg-violet-600 text-white hover:bg-violet-700 shadow-violet-100 active:scale-95'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={28} />
                    Publicando...
                  </>
                ) : (
                  <>
                    <Lock size={24} className={allChecked ? 'text-violet-200' : 'text-slate-300'} />
                    Lanzar mi campaña
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateReview;

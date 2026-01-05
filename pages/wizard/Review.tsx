
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, Edit, Tag, HeartHandshake, AlertCircle, RefreshCcw, ShieldCheck, UserCheck } from 'lucide-react';
import { useCampaign } from '../../context/CampaignContext';
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

const CreateReview: React.FC = () => {
  const navigate = useNavigate();
  const { campaign, resetCampaign } = useCampaign();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const service = CampaignService.getInstance();

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Llamada al servicio con TODOS los campos necesarios
      const result = await service.createCampaign({
        titulo: campaign.titulo || '',
        historia: campaign.historia || '',
        monto: campaign.monto || 0,
        categoria: campaign.categoria || 'Varios',
        ubicacion: campaign.ubicacion || 'Chile',
        imagenUrl: campaign.imagenUrl || '',
        beneficiarioNombre: campaign.beneficiarioNombre || '',
        beneficiarioRelacion: campaign.beneficiarioRelacion || 'Yo mismo'
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
            navigate('/explorar');
          }}
          className="bg-slate-900 text-white px-10 py-5 rounded-[24px] font-black text-xl hover:bg-slate-800 shadow-2xl transition-all active:scale-95"
        >
          Ir al explorador
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <ProgressBar currentStep={4} totalSteps={4} />

      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-slate-400 hover:text-violet-600 mb-8 transition-colors font-bold">
        <ChevronLeft size={20} /> Volver
      </button>

      <div className="text-center mb-16">
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Todo listo para el lanzamiento</h1>
        <p className="text-slate-500 font-medium text-lg">Revisa los detalles finales antes de publicar tu causa.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl p-10 relative overflow-hidden">
          {isSubmitting && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <span className="font-black text-violet-600 uppercase tracking-widest text-sm">Publicando tu historia...</span>
            </div>
          )}

          <ReviewItem 
            icon={Tag}
            label="Título"
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
          
          <div className="py-8 border-t border-slate-50 mt-4">
             <span className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Vista previa de la historia</span>
             <div className="bg-slate-50 p-6 rounded-3xl text-slate-600 leading-relaxed text-sm italic">
               "{campaign.historia?.substring(0, 300)}..."
             </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-lg overflow-hidden">
             <div className="aspect-video relative">
                <img src={campaign.imagenUrl} className="w-full h-full object-cover" alt="Portada" />
                <div className="absolute top-4 left-4">
                   <span className="bg-violet-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                     {campaign.categoria}
                   </span>
                </div>
             </div>
             <div className="p-8">
                <h3 className="font-black text-slate-900 mb-2">Imagen de portada</h3>
                <p className="text-slate-400 text-xs font-bold leading-relaxed">Esta es la imagen que los donantes verán primero al explorar las causas.</p>
                <button 
                  onClick={() => navigate('/crear/detalles')}
                  className="mt-4 text-violet-600 font-black text-xs uppercase tracking-widest hover:underline"
                >
                  Cambiar foto
                </button>
             </div>
          </div>

          <div className="bg-sky-50 rounded-3xl p-6 border-2 border-sky-100 flex gap-4">
            <ShieldCheck size={24} className="text-sky-600 shrink-0" />
            <p className="text-[10px] font-bold text-sky-800 uppercase tracking-widest leading-relaxed">
              Al publicar, confirmas que toda la información es verdadera y que los fondos serán utilizados para el fin declarado.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-8 mb-8 p-6 bg-rose-50 border-2 border-rose-100 rounded-[32px] flex flex-col md:flex-row gap-6 items-center animate-in slide-in-from-top-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-500 shadow-sm shrink-0">
            <AlertCircle size={24} />
          </div>
          <div className="flex-grow text-center md:text-left">
            <p className="text-rose-900 font-bold mb-1">¡Ups! Algo no salió como esperábamos</p>
            <p className="text-rose-700/70 text-sm font-medium">{error}</p>
          </div>
          <button 
            onClick={handleSubmit}
            className="flex items-center gap-2 bg-rose-500 text-white px-6 py-3 rounded-2xl font-bold hover:bg-rose-600 transition-all shadow-md shadow-rose-200"
          >
            <RefreshCcw size={18} /> Reintentar
          </button>
        </div>
      )}

      {!isSuccess && (
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`w-full mt-10 py-6 rounded-[28px] font-black text-2xl transition-all flex items-center justify-center gap-3 shadow-2xl ${
            isSubmitting 
            ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
            : 'bg-violet-600 text-white hover:bg-violet-700 shadow-violet-100 active:scale-95'
          }`}
        >
          {isSubmitting ? 'Procesando...' : 'Lanzar mi campaña'}
        </button>
      )}
    </div>
  );
};

export default CreateReview;


import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, Edit, MapPin, Tag, HeartHandshake, AlertCircle } from 'lucide-react';
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
    setIsSubmitting(true);
    setError(null);
    try {
      await service.createCampaign({
        titulo: campaign.titulo || '',
        historia: campaign.historia || '',
        monto: campaign.monto || 0,
        categoria: campaign.categoria || 'Varios',
        ubicacion: campaign.ubicacion || 'Chile'
      });
      setIsSubmitting(false);
      setIsSuccess(true);
    } catch (err: any) {
      console.error("Error publishing:", err);
      setError(err.message || "No se pudo conectar con el servidor.");
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-32 text-center">
        <div className="w-24 h-24 bg-violet-100 text-violet-600 rounded-[32px] flex items-center justify-center mx-auto mb-10 animate-bounce">
          <CheckCircle size={56} />
        </div>
        <h1 className="text-5xl font-black text-slate-900 mb-6 tracking-tight">¡Misión cumplida!</h1>
        <p className="text-slate-500 text-xl mb-12 font-medium leading-relaxed">
          Tu historia ya está en Donia lista para recibir apoyo.
        </p>
        <button 
          onClick={() => {
            resetCampaign();
            navigate('/explorar');
          }}
          className="bg-violet-600 text-white px-10 py-5 rounded-[24px] font-black text-xl hover:bg-violet-700 shadow-2xl shadow-violet-100 transition-all"
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
        <p className="text-slate-500 font-medium text-lg">Confirma los detalles de tu campaña solidaria.</p>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl p-10 mb-10">
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
        <div className="py-8">
           <span className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Vista previa de la historia</span>
           <div className="bg-slate-50 p-6 rounded-3xl text-slate-600 leading-relaxed text-sm italic">
             "{campaign.historia?.substring(0, 300)}..."
           </div>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-6 bg-red-50 border border-red-100 rounded-[28px] flex gap-4 items-center animate-shake">
          <AlertCircle className="text-red-500 shrink-0" size={24} />
          <p className="text-red-800 font-medium text-sm">
            <strong className="block mb-1">Error de publicación:</strong>
            {error}
          </p>
        </div>
      )}

      <button 
        onClick={handleSubmit}
        disabled={isSubmitting}
        className={`w-full py-6 rounded-[28px] font-black text-2xl transition-all flex items-center justify-center gap-3 shadow-2xl ${
          isSubmitting 
          ? 'bg-slate-100 text-slate-300 cursor-wait' 
          : 'bg-violet-600 text-white hover:bg-violet-700 shadow-violet-100 active:scale-95'
        }`}
      >
        {isSubmitting ? 'Publicando...' : 'Lanzar campaña ahora'}
      </button>
    </div>
  );
};

export default CreateReview;


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Wand2, 
  Loader2, 
  AlertCircle, 
  Sparkles, 
  Check, 
  X,
  Zap,
  Heart,
  MessageSquareQuote
} from 'lucide-react';
import { useCampaign } from '../../context/CampaignContext';
import { ProgressBar } from '../../components/ProgressBar';
import { CampaignService } from '../../services/CampaignService';

const ComparisonModal = ({ 
  original, 
  polished, 
  onAccept, 
  onClose,
  isProcessing 
}: { 
  original: string, 
  polished: string, 
  onAccept: () => void, 
  onClose: () => void,
  isProcessing: boolean
}) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
    <div className="bg-white w-full max-w-5xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
      
      {/* Header del Modal */}
      <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-violet-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-violet-200">
            <Sparkles size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Propuesta de optimización</h3>
            <p className="text-slate-500 font-medium text-sm">Hemos ajustado el tono para generar mayor conexión emocional.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
              <Check size={12} /> Claridad
           </div>
           <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-50 text-violet-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-violet-100">
              <Heart size={12} /> Empatía
           </div>
        </div>
      </div>

      {/* Contenido Comparativo */}
      <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Lado Izquierdo: Original */}
          <div className="space-y-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              Tu borrador original
            </span>
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-slate-500 text-sm leading-relaxed italic min-h-[300px]">
              {original}
            </div>
          </div>

          {/* Lado Derecho: Polished */}
          <div className="space-y-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-violet-500 flex items-center gap-2">
              <Zap size={12} className="fill-current" /> Versión optimizada por Donia IA
            </span>
            <div className="p-6 bg-violet-50/30 rounded-3xl border border-violet-100 text-slate-800 text-sm md:text-base font-medium leading-relaxed min-h-[300px] shadow-inner">
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 py-20">
                   <Loader2 size={32} className="text-violet-600 animate-spin" />
                   <p className="text-violet-600 font-black text-xs uppercase tracking-widest">Analizando y mejorando...</p>
                </div>
              ) : polished}
            </div>
          </div>
        </div>
      </div>

      {/* Footer del Modal */}
      <div className="p-8 border-t border-slate-100 flex flex-col md:flex-row gap-4 justify-end items-center bg-white">
        <p className="text-[11px] text-slate-400 font-medium md:mr-auto max-w-sm text-center md:text-left">
          Nuestra IA mejora la narrativa y estructura, pero asegúrate de que todos los hechos sigan siendo veraces antes de aceptar.
        </p>
        <button 
          onClick={onClose}
          className="px-8 py-4 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-600 transition-colors"
        >
          Mantener mi original
        </button>
        <button 
          onClick={onAccept}
          disabled={isProcessing || !polished}
          className="bg-violet-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-violet-700 transition-all shadow-xl shadow-violet-200 flex items-center gap-2 active:scale-95 disabled:opacity-50"
        >
          Usar esta versión <Check size={20} />
        </button>
      </div>
    </div>
  </div>
);

const CreateStory: React.FC = () => {
  const navigate = useNavigate();
  const { campaign, updateCampaign } = useCampaign();
  const [localStory, setLocalStory] = useState(campaign.historia || '');
  const [polishedProposal, setPolishedProposal] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [canUseAi, setCanUseAi] = useState(false);
  
  const service = CampaignService.getInstance();
  const MIN_LENGTH = 100;

  useEffect(() => {
    setCanUseAi(service.checkAiAvailability());
  }, []);

  const handleNext = () => {
    if (localStory.length < MIN_LENGTH) return;
    updateCampaign({ historia: localStory });
    navigate('/crear/detalles');
  };

  const startAiPolish = async () => {
    if (!localStory || localStory.length < 20) return;
    setShowModal(true);
    setIsAiProcessing(true);
    try {
      const polished = await service.polishStory(localStory);
      setPolishedProposal(polished);
    } catch (err) {
      console.error("Error en pulido de IA:", err);
      setShowModal(false);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleAcceptProposal = () => {
    setLocalStory(polishedProposal);
    setShowModal(false);
    setPolishedProposal('');
  };

  const isValid = localStory.length >= MIN_LENGTH;
  const remainingChars = Math.max(0, MIN_LENGTH - localStory.length);

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <ProgressBar currentStep={2} totalSteps={4} />

      {showModal && (
        <ComparisonModal 
          original={localStory}
          polished={polishedProposal}
          onAccept={handleAcceptProposal}
          onClose={() => setShowModal(false)}
          isProcessing={isAiProcessing}
        />
      )}

      <button 
        onClick={() => navigate('/crear')}
        className="flex items-center gap-1 text-slate-400 hover:text-violet-600 mb-8 transition-colors font-bold"
      >
        <ChevronLeft size={20} /> Volver
      </button>

      <div className="mb-12">
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Escribe tu historia</h1>
        <p className="text-slate-500 font-medium text-lg leading-relaxed">
          Cuenta qué pasó y para qué necesitas los fondos. Un relato honesto y detallado genera un 40% más de donaciones.
        </p>
      </div>

      <div className="space-y-8">
        
        {/* Bloque Educativo sobre la IA */}
        {canUseAi && localStory.length >= 20 && !isValid && (
           <div className="bg-violet-50 border border-violet-100 p-6 rounded-[32px] flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-violet-600 shadow-sm shrink-0">
                 <Sparkles size={20} />
              </div>
              <div>
                 <h4 className="text-sm font-black text-violet-900 mb-1">¿Necesitas ayuda con las palabras?</h4>
                 <p className="text-xs text-violet-800/70 font-medium leading-relaxed">
                   Nuestra IA puede ayudarte a organizar tus ideas para que tu causa sea más clara, empática y fácil de leer para los donantes.
                 </p>
              </div>
           </div>
        )}

        <div className={`bg-white rounded-[40px] border-2 p-10 shadow-xl transition-all relative ${!isValid && localStory.length > 0 ? 'border-rose-200' : 'border-slate-100 focus-within:border-violet-300'}`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Relato de la campaña</span>
            {canUseAi && (
              <button
                onClick={startAiPolish}
                disabled={isAiProcessing || localStory.length < 20}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black transition-all shadow-lg hover:-translate-y-0.5 active:scale-95 ${
                  isAiProcessing 
                  ? 'bg-slate-100 text-slate-400 cursor-wait' 
                  : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-violet-200 disabled:opacity-50 disabled:grayscale'
                }`}
              >
                <Wand2 size={16} />
                Optimizar con IA
              </button>
            )}
          </div>

          <textarea
            rows={12}
            className="w-full p-0 text-slate-700 text-lg leading-relaxed placeholder:text-slate-200 border-none outline-none resize-none bg-transparent"
            placeholder="Érase una vez..."
            value={localStory}
            onChange={(e) => setLocalStory(e.target.value)}
          />

          <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-50">
             {!isValid && localStory.length > 0 ? (
               <div className="flex items-center gap-2 text-rose-500 text-xs font-bold">
                  <AlertCircle size={14} />
                  <span>Agrega un poco más de detalle</span>
               </div>
             ) : (
               <div className="flex items-center gap-2 text-slate-400 text-xs font-bold italic">
                  <MessageSquareQuote size={14} />
                  Sé natural, la gente conecta con la verdad.
               </div>
             )}
             <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isValid ? 'text-emerald-500' : 'text-slate-300'}`}>
                {isValid 
                  ? 'Longitud perfecta' 
                  : `${remainingChars} caracteres restantes`
                }
             </span>
          </div>
        </div>

        <button 
          disabled={!isValid || isAiProcessing}
          onClick={handleNext}
          className={`w-full py-6 rounded-[28px] font-black text-xl transition-all flex items-center justify-center gap-3 shadow-2xl ${
            isValid && !isAiProcessing
            ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200 active:scale-95' 
            : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
          }`}
        >
          Continuar
          <ChevronRight className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default CreateStory;

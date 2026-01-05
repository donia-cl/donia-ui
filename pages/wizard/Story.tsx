
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Wand2, Loader2 } from 'lucide-react';
import { useCampaign } from '../../context/CampaignContext';
import { ProgressBar } from '../../components/ProgressBar';
import { CampaignService } from '../../services/CampaignService';

const CreateStory: React.FC = () => {
  const navigate = useNavigate();
  const { campaign, updateCampaign } = useCampaign();
  const [localStory, setLocalStory] = useState(campaign.historia || '');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [canUseAi, setCanUseAi] = useState(false);
  
  const service = CampaignService.getInstance();

  useEffect(() => {
    // Verificamos disponibilidad de IA al montar
    setCanUseAi(service.checkAiAvailability());
  }, []);

  const handleNext = () => {
    updateCampaign({ historia: localStory });
    navigate('/crear/detalles');
  };

  const handleAiPolish = async () => {
    if (!localStory || localStory.length < 20) return;
    setIsAiProcessing(true);
    try {
      const polished = await service.polishStory(localStory);
      if (polished !== localStory) {
        setLocalStory(polished);
      }
    } catch (err) {
      console.error("Error en pulido de IA:", err);
    } finally {
      setIsAiProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <ProgressBar currentStep={2} totalSteps={4} />

      <button 
        onClick={() => navigate('/crear')}
        className="flex items-center gap-1 text-slate-400 hover:text-violet-600 mb-8 transition-colors font-bold"
      >
        <ChevronLeft size={20} /> Volver
      </button>

      <div className="mb-12">
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Escribe tu historia</h1>
        <p className="text-slate-500 font-medium text-lg">
          No necesitas ser escritor. Solo sé tú mismo y cuéntanos por qué esta causa es importante.
        </p>
      </div>

      <div className="space-y-8">
        <div className="bg-white rounded-[32px] border-2 border-slate-100 p-8 shadow-sm focus-within:border-violet-200 transition-all relative">
          <label className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Relato de la campaña</span>
            {canUseAi && (
              <button
                onClick={handleAiPolish}
                disabled={isAiProcessing || localStory.length < 20}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all shadow-lg ${
                  isAiProcessing 
                  ? 'bg-slate-100 text-slate-400 cursor-wait' 
                  : 'bg-gradient-to-r from-violet-600 to-sky-500 text-white hover:shadow-violet-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none'
                }`}
              >
                {isAiProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Optimizando...
                  </>
                ) : (
                  <>
                    <Wand2 size={16} />
                    Perfeccionar con IA
                  </>
                )}
              </button>
            )}
          </label>

          <textarea
            rows={12}
            className={`w-full p-0 text-slate-700 text-lg leading-relaxed placeholder:text-slate-200 border-none outline-none resize-none bg-transparent transition-opacity ${
              isAiProcessing ? 'opacity-40' : 'opacity-100'
            }`}
            placeholder="Érase una vez..."
            value={localStory}
            onChange={(e) => setLocalStory(e.target.value)}
          />
        </div>

        <button 
          disabled={!localStory.trim() || isAiProcessing}
          onClick={handleNext}
          className={`w-full py-5 rounded-[24px] font-black text-xl transition-all flex items-center justify-center gap-3 shadow-2xl ${
            localStory.trim() && !isAiProcessing
            ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-violet-100' 
            : 'bg-slate-100 text-slate-300 cursor-not-allowed'
          }`}
        >
          Continuar
          <ChevronRight className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default CreateStory;

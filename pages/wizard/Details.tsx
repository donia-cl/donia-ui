
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, DollarSign } from 'lucide-react';
import { useCampaign } from '../../context/CampaignContext';
import { ProgressBar } from '../../components/ProgressBar';

const CreateDetails: React.FC = () => {
  const navigate = useNavigate();
  const { campaign, updateCampaign } = useCampaign();
  
  const [formData, setFormData] = useState({
    titulo: campaign.titulo || '',
    monto: campaign.monto || 0,
    categoria: campaign.categoria || 'Salud'
  });

  const handleNext = () => {
    updateCampaign(formData);
    navigate('/crear/revisar');
  };

  const isValid = formData.titulo.trim().length > 5 && formData.monto > 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <ProgressBar currentStep={3} totalSteps={4} />

      <button 
        onClick={() => navigate('/crear/historia')}
        className="flex items-center gap-1 text-slate-400 hover:text-violet-600 mb-8 transition-colors font-black"
      >
        <ChevronLeft size={20} /> Volver
      </button>

      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Detalles finales</h1>
        <p className="text-slate-500 font-medium text-lg leading-relaxed">
          Dale un título impactante a tu campaña y define cuánto necesitas recaudar.
        </p>
      </div>

      <div className="space-y-8">
        <div className="bg-white p-8 rounded-[32px] border-2 border-slate-100 shadow-sm">
          <div className="mb-8">
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Título de la campaña</label>
            <input
              type="text"
              className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-2xl transition-all outline-none font-bold text-slate-900"
              placeholder="Ej: Ayudemos a Sofía en su tratamiento"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Categoría</label>
              <select
                className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-2xl transition-all outline-none appearance-none font-bold text-slate-900"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              >
                <option value="Salud">Salud</option>
                <option value="Educación">Educación</option>
                <option value="Emergencias">Emergencias</option>
                <option value="Animales">Animales</option>
                <option value="Proyectos">Proyectos</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Monto objetivo (CLP)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <DollarSign size={18} />
                </div>
                <input
                  type="number"
                  className="w-full pl-10 p-4 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-2xl transition-all outline-none font-bold text-slate-900"
                  placeholder="0"
                  value={formData.monto || ''}
                  onChange={(e) => setFormData({ ...formData, monto: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
        </div>

        <button 
          disabled={!isValid}
          onClick={handleNext}
          className={`w-full py-5 rounded-[24px] font-black text-xl transition-all flex items-center justify-center gap-3 shadow-2xl ${
            isValid
            ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-violet-100' 
            : 'bg-slate-100 text-slate-300 cursor-not-allowed'
          }`}
        >
          Siguiente: Revisar
          <ChevronRight className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default CreateDetails;

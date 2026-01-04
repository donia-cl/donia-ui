
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, FileText, Layout, Info } from 'lucide-react';
import { ProgressBar } from '../../components/ProgressBar';

const StepInfo = ({ icon: Icon, label }: { icon: any, label: string }) => (
  <div className="flex items-center gap-4 p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
    <div className="bg-white p-2 rounded-xl shadow-sm">
      <Icon size={20} className="text-violet-600" />
    </div>
    <span className="text-slate-700 font-bold text-sm uppercase tracking-wide">{label}</span>
  </div>
);

const CreateIntro: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <ProgressBar currentStep={1} totalSteps={4} />
      
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Comencemos tu campaña</h1>
        <p className="text-slate-500 text-lg font-medium leading-relaxed">
          Estás a punto de crear una historia que puede cambiar vidas. Te guiaremos paso a paso para que tu campaña sea un éxito.
        </p>
      </div>

      <div className="space-y-4 mb-12">
        <StepInfo icon={FileText} label="Paso 1: Tu historia y narrativa" />
        <StepInfo icon={Layout} label="Paso 2: Título y monto objetivo" />
        <StepInfo icon={Info} label="Paso 3: Revisión de detalles" />
      </div>

      <button 
        onClick={() => navigate('/crear/historia')}
        className="w-full bg-violet-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-violet-700 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-violet-100"
      >
        Continuar a mi historia
        <ChevronRight className="group-hover:translate-x-1 transition-transform" />
      </button>

      <div className="mt-10 p-6 bg-sky-50 rounded-3xl flex gap-5 border border-sky-100">
        <div className="bg-white p-3 h-fit rounded-2xl text-sky-500 shadow-sm">
          <Info size={22} />
        </div>
        <p className="text-sm text-sky-900 leading-relaxed font-medium">
          <strong className="block text-sky-600 mb-1">Consejo Donia:</strong> Las campañas con una foto clara y una historia personal suelen recaudar hasta un 40% más de fondos.
        </p>
      </div>
    </div>
  );
};

export default CreateIntro;

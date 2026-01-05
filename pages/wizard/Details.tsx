
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, DollarSign, Image as ImageIcon, UserCheck, ShieldCheck, Loader2 } from 'lucide-react';
import { useCampaign } from '../../context/CampaignContext';
import { ProgressBar } from '../../components/ProgressBar';
import { CampaignService } from '../../services/CampaignService';

const CreateDetails: React.FC = () => {
  const navigate = useNavigate();
  const { campaign, updateCampaign } = useCampaign();
  const service = CampaignService.getInstance();
  
  const [formData, setFormData] = useState({
    titulo: campaign.titulo || '',
    monto: campaign.monto || 0,
    categoria: campaign.categoria || 'Salud',
    beneficiarioNombre: campaign.beneficiarioNombre || '',
    beneficiarioRelacion: campaign.beneficiarioRelacion || 'Yo mismo',
    imagenUrl: campaign.imagenUrl || ''
  });

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const url = await service.uploadImage(base64, file.name);
        setFormData(prev => ({ ...prev, imagenUrl: url }));
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Error al subir la imagen");
      setUploading(false);
    }
  };

  const handleNext = () => {
    updateCampaign(formData);
    navigate('/crear/revisar');
  };

  const isValid = formData.titulo.trim().length > 5 && 
                  formData.monto >= 500 && 
                  formData.beneficiarioNombre.trim().length > 2 &&
                  formData.imagenUrl !== '';

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <ProgressBar currentStep={3} totalSteps={4} />

      <button 
        onClick={() => navigate('/crear/historia')}
        className="flex items-center gap-1 text-slate-400 hover:text-violet-600 mb-8 transition-colors font-black"
      >
        <ChevronLeft size={20} /> Volver
      </button>

      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Casi terminamos</h1>
        <p className="text-slate-500 font-medium text-lg">Define los detalles técnicos y la transparencia de tu causa.</p>
      </div>

      <div className="space-y-8">
        {/* Imagen de Portada */}
        <div className="bg-white p-8 rounded-[32px] border-2 border-slate-100 shadow-sm">
          <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Imagen de portada</label>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`relative aspect-video rounded-3xl border-2 border-dashed border-slate-200 overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:border-violet-300 transition-all ${formData.imagenUrl ? 'border-none' : 'bg-slate-50'}`}
          >
            {formData.imagenUrl ? (
              <>
                <img src={formData.imagenUrl} className="w-full h-full object-cover" alt="Preview" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-white font-bold flex items-center gap-2"> <RefreshCcw size={18} /> Cambiar imagen</span>
                </div>
              </>
            ) : uploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="text-violet-600 animate-spin" size={32} />
                <span className="font-bold text-slate-400">Subiendo...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <ImageIcon size={32} />
                </div>
                <p className="font-bold text-sm">Haz clic para subir una foto</p>
                <p className="text-xs">Recomendado: 1200x675px</p>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageChange}
            />
          </div>
        </div>

        {/* Datos de la Causa */}
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
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Categoría</label>
              <select
                className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-2xl transition-all outline-none font-bold text-slate-900"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              >
                <option value="Salud">Salud</option>
                <option value="Emergencias">Emergencias</option>
                <option value="Animales">Animales</option>
                <option value="Educación">Educación</option>
              </select>
            </div>
          </div>
        </div>

        {/* Beneficiario */}
        <div className="bg-white p-8 rounded-[32px] border-2 border-slate-100 shadow-sm border-l-8 border-l-sky-400">
          <div className="flex items-center gap-3 mb-8">
             <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600">
               <ShieldCheck size={22} />
             </div>
             <div>
               <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Transparencia</h3>
               <p className="text-slate-400 text-[10px] font-bold">Información del beneficiario de los fondos</p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Nombre del Beneficiario</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <UserCheck size={18} />
                </div>
                <input
                  type="text"
                  className="w-full pl-10 p-4 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-2xl transition-all outline-none font-bold text-slate-900"
                  placeholder="Nombre completo"
                  value={formData.beneficiarioNombre}
                  onChange={(e) => setFormData({ ...formData, beneficiarioNombre: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Relación contigo</label>
              <select
                className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-2xl transition-all outline-none font-bold text-slate-900"
                value={formData.beneficiarioRelacion}
                onChange={(e) => setFormData({ ...formData, beneficiarioRelacion: e.target.value })}
              >
                <option value="Yo mismo">Yo mismo</option>
                <option value="Hijo/a">Hijo/a</option>
                <option value="Familiar">Familiar</option>
                <option value="Amigo/a">Amigo/a</option>
                <option value="Vecino/a">Vecino/a</option>
                <option value="Organización">Organización</option>
              </select>
            </div>
          </div>
        </div>

        <button 
          disabled={!isValid || uploading}
          onClick={handleNext}
          className={`w-full py-5 rounded-[24px] font-black text-xl transition-all flex items-center justify-center gap-3 shadow-2xl ${
            isValid && !uploading
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

const RefreshCcw = ({size}: {size: number}) => <ImageIcon size={size} />; // Fallback icon

export default CreateDetails;

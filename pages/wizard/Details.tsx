
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, DollarSign, Image as ImageIcon, UserCheck, ShieldCheck, Loader2, AlertCircle, RefreshCcw, Calendar, Clock } from 'lucide-react';
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
    imagenUrl: campaign.imagenUrl || '',
    duracionDias: campaign.duracionDias || 60
  });

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación de cliente: Máximo 3MB para asegurar que el Base64 entre en el payload de 4.5MB de Vercel
    if (file.size > 3 * 1024 * 1024) {
      setUploadError("La imagen es muy pesada. El máximo permitido es 3MB.");
      return;
    }

    setUploading(true);
    setUploadError(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onloadend = async () => {
      try {
        const base64 = reader.result as string;
        const url = await service.uploadImage(base64, file.name);
        setFormData(prev => ({ ...prev, imagenUrl: url }));
      } catch (err: any) {
        console.error("Detalle del error de subida:", err);
        let msg = "No pudimos subir la imagen. Inténtalo de nuevo.";
        if (err.message.includes("permisos")) msg = "Error de configuración de seguridad en el servidor.";
        if (err.message.includes("Valid JSON")) msg = "Error del servidor: La imagen es demasiado grande o hubo un problema interno.";
        setUploadError(msg);
      } finally {
        setUploading(false);
      }
    };

    reader.onerror = () => {
      setUploadError("Error al leer el archivo desde tu dispositivo.");
      setUploading(false);
    };
  };

  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Eliminar puntos y caracteres no numéricos
    const rawValue = e.target.value.replace(/\./g, '').replace(/\D/g, '');
    const numberValue = rawValue === '' ? 0 : parseInt(rawValue, 10);
    setFormData({ ...formData, monto: numberValue });
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
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`relative aspect-video rounded-3xl border-2 border-dashed overflow-hidden flex flex-col items-center justify-center cursor-pointer transition-all ${
              formData.imagenUrl ? 'border-none shadow-inner' : 
              uploadError ? 'border-rose-300 bg-rose-50' : 
              'border-slate-200 bg-slate-50 hover:border-violet-300'
            }`}
          >
            {formData.imagenUrl ? (
              <>
                <img src={formData.imagenUrl} className="w-full h-full object-cover" alt="Preview" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-white font-bold flex items-center gap-2 bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm"> 
                    <RefreshCcw size={18} /> Cambiar imagen
                  </span>
                </div>
              </>
            ) : uploading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Loader2 className="text-violet-600 animate-spin" size={48} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-violet-600 rounded-full animate-ping"></div>
                  </div>
                </div>
                <span className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Subiendo a la nube...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-400 px-10 text-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <ImageIcon size={32} />
                </div>
                <p className="font-bold text-sm">Haz clic para subir una foto</p>
                <p className="text-[10px] uppercase tracking-wider font-black opacity-60">JPG o PNG (Máx 3MB)</p>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/jpeg,image/png" 
              onChange={handleImageChange}
            />
          </div>
          {uploadError && (
            <div className="mt-4 p-4 bg-rose-50 text-rose-600 rounded-2xl text-xs font-bold flex items-center gap-3 border border-rose-100 animate-in fade-in slide-in-from-top-1">
              <div className="bg-white p-1.5 rounded-lg shadow-sm">
                <AlertCircle size={16} />
              </div>
              {uploadError}
            </div>
          )}
        </div>

        {/* Detalles de la Campaña */}
        <div className="bg-white p-8 rounded-[32px] border-2 border-slate-100 shadow-sm">
          <div className="mb-8">
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Título de la campaña</label>
            <input
              type="text"
              className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-2xl transition-all outline-none font-bold text-slate-900"
              placeholder="Ej: Ayudemos a Juan en su tratamiento"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Monto objetivo (CLP)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <DollarSign size={18} />
                </div>
                <input
                  type="text"
                  className="w-full pl-10 p-4 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-2xl transition-all outline-none font-bold text-slate-900"
                  placeholder="0"
                  value={formData.monto > 0 ? formData.monto.toLocaleString('es-CL') : ''}
                  onChange={handleMontoChange}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Categoría</label>
              <select
                className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-2xl transition-all outline-none font-bold text-slate-900 appearance-none"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              >
                <option value="Salud">Salud</option>
                <option value="Educación">Educación</option>
                <option value="Emergencias">Emergencias</option>
                <option value="Animales">Animales</option>
                <option value="Comunidad">Comunidad</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
             <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Duración</label>
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                     <Clock size={18} />
                   </div>
                   <select 
                      className="w-full pl-10 p-4 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-2xl transition-all outline-none font-bold text-slate-900 appearance-none"
                      value={formData.duracionDias}
                      onChange={(e) => setFormData({ ...formData, duracionDias: Number(e.target.value) })}
                   >
                     <option value={30}>30 Días</option>
                     <option value={60}>60 Días</option>
                     <option value={90}>90 Días</option>
                   </select>
                </div>
             </div>
             <div className="flex items-center">
                 <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    La campaña estará activa por el periodo seleccionado. El tiempo empieza a correr una vez publicada.
                 </p>
             </div>
          </div>
        </div>

        {/* Transparencia */}
        <div className="bg-white p-8 rounded-[32px] border-2 border-slate-100 shadow-sm">
           <div className="flex items-center gap-3 mb-6">
              <ShieldCheck size={24} className="text-violet-600" />
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Transparencia del Beneficiario</h2>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                 <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Nombre Completo</label>
                 <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                       <UserCheck size={18} />
                    </div>
                    <input
                       type="text"
                       className="w-full pl-10 p-4 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-2xl transition-all outline-none font-bold text-slate-900"
                       placeholder="Nombre del beneficiario"
                       value={formData.beneficiarioNombre}
                       onChange={(e) => setFormData({ ...formData, beneficiarioNombre: e.target.value })}
                    />
                 </div>
              </div>
              
              <div>
                 <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Relación contigo</label>
                 <select
                    className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-2xl transition-all outline-none font-bold text-slate-900 appearance-none"
                    value={formData.beneficiarioRelacion}
                    onChange={(e) => setFormData({ ...formData, beneficiarioRelacion: e.target.value })}
                 >
                    <option value="Yo mismo">Yo mismo</option>
                    <option value="Familiar">Familiar</option>
                    <option value="Amigo">Amigo</option>
                    <option value="Organización">Organización</option>
                    <option value="Mascota">Mascota</option>
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
          Revisar y Publicar
          <ChevronRight className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default CreateDetails;


import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Save, 
  Wand2, 
  Loader2, 
  Image as ImageIcon, 
  AlertCircle, 
  RefreshCcw,
  CheckCircle,
  Layout,
  FileText,
  ShieldCheck,
  DollarSign,
  UserCheck,
  // Fix: Add missing Settings icon import
  Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CampaignService } from '../services/CampaignService';
import { CampaignData } from '../types';

const EditCampaign: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const service = CampaignService.getInstance();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    titulo: '',
    historia: '',
    monto: 0,
    categoria: 'Salud',
    beneficiarioNombre: '',
    beneficiarioRelacion: 'Yo mismo',
    imagenUrl: ''
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
    if (id && user) {
      loadCampaign();
    }
  }, [id, user, authLoading]);

  const loadCampaign = async () => {
    setLoading(true);
    try {
      const data = await service.getCampaignById(id!);
      if (!data) {
        setError("Campaña no encontrada");
        return;
      }
      // Aquí ideally verificaríamos si el user.id coincide con el creador, 
      // pero la API ya lo hace al guardar.
      setFormData({
        titulo: data.titulo,
        historia: data.historia,
        monto: data.monto,
        categoria: data.categoria,
        beneficiarioNombre: data.beneficiarioNombre || '',
        beneficiarioRelacion: data.beneficiarioRelacion || 'Yo mismo',
        imagenUrl: data.imagenUrl
      });
    } catch (e) {
      setError("Error al cargar los datos de la campaña.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen es muy pesada (máx 5MB)");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      try {
        const base64 = reader.result as string;
        const url = await service.uploadImage(base64, file.name);
        setFormData(prev => ({ ...prev, imagenUrl: url }));
      } catch (err) {
        setError("Error al subir la imagen.");
      } finally {
        setUploading(false);
      }
    };
  };

  const handleAiPolish = async () => {
    if (!formData.historia || formData.historia.length < 20) return;
    setIsAiProcessing(true);
    try {
      const polished = await service.polishStory(formData.historia);
      setFormData(prev => ({ ...prev, historia: polished }));
    } catch (err) {
      console.error("Error en pulido de IA:", err);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!id || !user) return;
    setSaving(true);
    setError(null);
    try {
      await service.updateCampaign(id, user.id, {
        titulo: formData.titulo,
        historia: formData.historia,
        monto: Number(formData.monto),
        categoria: formData.categoria,
        imagen_url: formData.imagenUrl,
        beneficiario_nombre: formData.beneficiarioNombre,
        beneficiario_relacion: formData.beneficiarioRelacion
      });
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (e: any) {
      setError(e.message || "No se pudo actualizar la campaña.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-violet-600 animate-spin mb-4" />
        <span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Cargando editor...</span>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-32 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-lg">
          <CheckCircle size={40} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">¡Cambios guardados!</h1>
        <p className="text-slate-500 font-medium mb-8">Tu campaña ha sido actualizada con éxito. Redirigiendo al panel...</p>
      </div>
    );
  }

  const isFormValid = formData.titulo.length > 5 && formData.historia.length > 20 && formData.monto >= 500;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-12">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-slate-400 hover:text-violet-600 transition-colors font-black uppercase text-xs tracking-widest"
        >
          <ChevronLeft size={20} /> Cancelar edición
        </button>
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-violet-600 text-white rounded-xl flex items-center justify-center shadow-lg">
              <Settings size={20} />
           </div>
           <h1 className="text-3xl font-black text-slate-900 tracking-tight">Editar Campaña</h1>
        </div>
      </div>

      <div className="space-y-8">
        {/* Sección: Imagen */}
        <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm">
           <div className="flex items-center gap-3 mb-6">
              <ImageIcon size={20} className="text-violet-600" />
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Imagen de portada</h2>
           </div>
           
           <div 
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`relative aspect-video rounded-[32px] border-2 border-dashed overflow-hidden flex flex-col items-center justify-center cursor-pointer transition-all ${
              uploading ? 'bg-slate-50 opacity-50' : 'bg-slate-50 hover:border-violet-300'
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
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <ImageIcon size={32} />
                <p className="font-bold text-sm">Sube una nueva foto</p>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/jpeg,image/png" 
              onChange={handleImageChange}
            />
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                <Loader2 className="animate-spin text-violet-600" size={32} />
              </div>
            )}
          </div>
        </div>

        {/* Sección: General */}
        <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm">
           <div className="flex items-center gap-3 mb-8">
              <Layout size={20} className="text-violet-600" />
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Información General</h2>
           </div>
           
           <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Título de la campaña</label>
                <input
                  type="text"
                  className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-2xl transition-all outline-none font-bold text-slate-900"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Monto Objetivo (CLP)</label>
                  <div className="relative">
                    <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input
                      type="number"
                      className="w-full pl-11 p-4 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-2xl transition-all outline-none font-bold text-slate-900"
                      value={formData.monto}
                      onChange={(e) => setFormData({ ...formData, monto: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Categoría</label>
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
        </div>

        {/* Sección: Historia */}
        <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div className="flex items-center gap-3">
                 <FileText size={20} className="text-violet-600" />
                 <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">El Relato</h2>
              </div>
              <button
                onClick={handleAiPolish}
                disabled={isAiProcessing || formData.historia.length < 20}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black transition-all shadow-lg ${
                  isAiProcessing 
                  ? 'bg-slate-100 text-slate-400 cursor-wait' 
                  : 'bg-gradient-to-r from-violet-600 to-sky-500 text-white hover:shadow-violet-200 hover:-translate-y-0.5 disabled:opacity-50'
                }`}
              >
                {isAiProcessing ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                {isAiProcessing ? 'Mejorando relato...' : 'Perfeccionar con IA'}
              </button>
           </div>
           
           <textarea
             rows={10}
             className={`w-full p-6 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-[32px] outline-none font-medium text-slate-700 leading-relaxed transition-all resize-none ${
               isAiProcessing ? 'opacity-40' : 'opacity-100'
             }`}
             value={formData.historia}
             onChange={(e) => setFormData({ ...formData, historia: e.target.value })}
           />
        </div>

        {/* Sección: Transparencia */}
        <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm border-l-8 border-l-sky-400">
           <div className="flex items-center gap-3 mb-8">
              <ShieldCheck size={20} className="text-sky-600" />
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Transparencia del Beneficiario</h2>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Nombre Completo</label>
                <div className="relative">
                   <UserCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                   <input
                    type="text"
                    className="w-full pl-11 p-4 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-2xl transition-all outline-none font-bold text-slate-900"
                    value={formData.beneficiarioNombre}
                    onChange={(e) => setFormData({ ...formData, beneficiarioNombre: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Relación</label>
                <select
                  className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-2xl transition-all outline-none font-bold text-slate-900"
                  value={formData.beneficiarioRelacion}
                  onChange={(e) => setFormData({ ...formData, beneficiarioRelacion: e.target.value })}
                >
                  <option value="Yo mismo">Yo mismo</option>
                  <option value="Hijo/a">Hijo/a</option>
                  <option value="Familiar">Familiar</option>
                  <option value="Amigo/a">Amigo/a</option>
                  <option value="Organización">Organización</option>
                </select>
              </div>
           </div>
        </div>

        {error && (
          <div className="p-6 bg-rose-50 border-2 border-rose-100 rounded-[32px] flex items-center gap-4 text-rose-700 animate-in slide-in-from-top-4">
             <AlertCircle size={24} />
             <p className="font-bold text-sm">{error}</p>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4 pt-4 pb-20">
           <button
             onClick={() => navigate('/dashboard')}
             className="flex-1 py-5 rounded-[24px] font-black text-slate-400 hover:text-slate-600 transition-all uppercase tracking-widest text-xs"
           >
             Descartar cambios
           </button>
           <button
             disabled={!isFormValid || saving || uploading}
             onClick={handleSave}
             className={`flex-[2] py-5 rounded-[24px] font-black text-xl transition-all flex items-center justify-center gap-3 shadow-2xl ${
               isFormValid && !saving && !uploading
               ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-violet-100 active:scale-95' 
               : 'bg-slate-100 text-
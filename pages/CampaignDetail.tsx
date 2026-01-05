
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  MapPin, 
  Users, 
  Heart, 
  Share2, 
  ShieldCheck, 
  User, 
  MessageCircle, 
  AlertCircle, 
  Calendar,
  Facebook,
  Twitter,
  Link as LinkIcon,
  Check
} from 'lucide-react';
import { CampaignService } from '../services/CampaignService';
import { CampaignData, Donation } from '../types';

const CampaignDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [donating, setDonating] = useState(false);
  const [donationAmount, setDonationAmount] = useState<number>(5000);
  
  const [donorName, setDonorName] = useState<string>('');
  const [donorComment, setDonorComment] = useState<string>('');
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');
  const [error, setError] = useState<string | null>(null);

  const service = CampaignService.getInstance();

  const fetchDetail = async () => {
    if (id) {
      try {
        const result = await service.getCampaignById(id);
        setCampaign(result);
      } catch (err) {
        console.error("Error cargando detalle:", err);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleDonate = async () => {
    if (!campaign || donationAmount < 500) {
      alert("Por favor, ingresa un monto válido (mínimo $500).");
      return;
    }
    
    setDonating(true);
    setError(null);
    try {
      await service.donate(
        campaign.id, 
        donationAmount, 
        donorName.trim() || 'Anónimo', 
        donorComment.trim()
      );
      
      await fetchDetail(); 
      alert("¡Tu donación ha sido recibida! Muchas gracias por apoyar esta causa.");
      
      setDonorName('');
      setDonorComment('');
      setDonationAmount(5000);
    } catch (e: any) {
      setError(e.message || "No pudimos procesar la donación.");
    } finally {
      setDonating(false);
    }
  };

  // Funciones de Compartir
  const shareUrl = window.location.href;
  const shareText = campaign ? `Apoya esta causa en Donia: ${campaign.titulo}` : 'Apoya esta causa en Donia';

  const shareOnWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareUrl)}`;
    window.open(url, '_blank');
  };

  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  const shareOnX = () => {
    const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000);
    } catch (err) {
      console.error("Error al copiar:", err);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <span className="text-violet-600 font-black uppercase tracking-widest text-sm">Cargando causa...</span>
    </div>
  );

  if (!campaign) return (
    <div className="p-20 text-center max-w-xl mx-auto">
      <AlertCircle size={40} className="mx-auto mb-6 text-slate-400" />
      <h2 className="text-3xl font-black text-slate-900 mb-4">Causa no encontrada</h2>
      <button onClick={() => navigate('/explorar')} className="bg-violet-600 text-white px-8 py-4 rounded-2xl font-black">
        Ver otras campañas
      </button>
    </div>
  );

  const progress = Math.min((campaign.recaudado / campaign.monto) * 100, 100);

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 pt-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-violet-600 font-bold mb-8 transition-colors group">
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Volver
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-8 leading-tight">{campaign.titulo}</h1>
            
            <div className="relative rounded-[40px] overflow-hidden mb-12 shadow-2xl bg-slate-200">
              <img src={campaign.imagenUrl} alt={campaign.titulo} className="w-full aspect-video object-cover" />
              <div className="absolute bottom-6 left-6">
                <span className="bg-sky-500 text-white font-black px-5 py-2 rounded-full text-xs uppercase tracking-widest shadow-xl">
                  {campaign.categoria}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-sm border border-slate-100 mb-10">
              <div className="flex flex-wrap gap-8 mb-10 pb-8 border-b border-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600">
                    <MapPin size={20} />
                  </div>
                  <span className="font-bold text-slate-700">{campaign.ubicacion}</span>
                </div>
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600">
                    <Users size={20} />
                  </div>
                  <span className="font-bold text-slate-700">{campaign.donantesCount} donantes</span>
                </div>
              </div>

              <div className="prose prose-lg max-w-none mb-12">
                <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">La historia</h2>
                <div className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap">
                  {campaign.historia}
                </div>
              </div>

              {/* Sección de Mensajes de Apoyo */}
              <div className="pt-10 border-t border-slate-100">
                <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight flex items-center gap-3">
                  <MessageCircle className="text-violet-600" />
                  Mensajes de apoyo
                </h2>
                
                <div className="space-y-6">
                  {campaign.donations && campaign.donations.length > 0 ? (
                    campaign.donations.map((don: Donation) => (
                      <div key={don.id} className="bg-slate-50 p-6 rounded-[24px] border border-slate-100">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-violet-600 shadow-sm border border-slate-100">
                              <User size={18} />
                            </div>
                            <div>
                              <p className="font-black text-slate-900 text-sm">{don.nombreDonante}</p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                <Calendar size={10} />
                                {new Date(don.fecha).toLocaleDateString('es-CL')}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                            Donó ${don.monto?.toLocaleString('es-CL')}
                          </span>
                        </div>
                        {don.comentario && (
                          <p className="text-slate-600 font-medium leading-relaxed italic ml-12">
                            "{don.comentario}"
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 bg-slate-50 rounded-[24px] border-2 border-dashed border-slate-100">
                      <p className="text-slate-400 font-bold">Sé el primero en dejar un mensaje de apoyo.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-white rounded-[40px] p-8 shadow-xl shadow-violet-100/40 border border-violet-50">
              <div className="mb-8">
                <div className="flex justify-between items-end mb-4">
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Recaudado</span>
                    <span className="text-4xl font-black text-slate-900">${campaign.recaudado.toLocaleString('es-CL')}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Meta</span>
                    <span className="block text-lg font-bold text-slate-500">${campaign.monto.toLocaleString('es-CL')}</span>
                  </div>
                </div>
                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-gradient-to-r from-violet-600 to-sky-400 rounded-full" style={{ width: `${progress}%` }} />
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3 items-center text-rose-700">
                  <AlertCircle size={18} />
                  <p className="text-xs font-bold">{error}</p>
                </div>
              )}

              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-3">
                  {[3000, 5000, 10000].map(amt => (
                    <button 
                      key={amt}
                      onClick={() => setDonationAmount(amt)}
                      className={`py-3 rounded-2xl text-xs font-black border-2 transition-all ${donationAmount === amt ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white border-slate-100 text-slate-500'}`}
                    >
                      ${amt.toLocaleString()}
                    </button>
                  ))}
                </div>
                
                <div className="space-y-4">
                  <input 
                    type="number" 
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-2xl outline-none font-black text-slate-900"
                    placeholder="Monto"
                    value={donationAmount || ''}
                    onChange={(e) => setDonationAmount(Number(e.target.value))}
                  />
                  <input 
                    type="text" 
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-2xl outline-none font-bold text-slate-700"
                    placeholder="Tu nombre (Opcional)"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                  />
                  <textarea 
                    rows={2}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-2xl outline-none font-medium text-slate-600 resize-none"
                    placeholder="Escribe un mensaje de apoyo..."
                    value={donorComment}
                    onChange={(e) => setDonorComment(e.target.value)}
                  />
                </div>

                <button 
                  onClick={handleDonate}
                  disabled={donating || donationAmount < 500}
                  className={`w-full py-5 rounded-[24px] font-black text-xl flex items-center justify-center gap-3 shadow-xl ${donating ? 'bg-slate-200 text-slate-400' : 'bg-violet-600 text-white hover:bg-violet-700'}`}
                >
                  {donating ? 'Donando...' : <><Heart size={24} className="fill-current" /> Donar ahora</>}
                </button>

                {/* Nueva Sección de Compartir */}
                <div className="pt-6 border-t border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Share2 size={12} /> Compartir esta causa
                  </p>
                  <div className="grid grid-cols-4 gap-3">
                    <button 
                      onClick={shareOnWhatsApp}
                      className="aspect-square bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all group"
                      title="Compartir en WhatsApp"
                    >
                      <MessageCircle className="group-hover:scale-110 transition-transform" size={24} />
                    </button>
                    <button 
                      onClick={shareOnFacebook}
                      className="aspect-square bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all group"
                      title="Compartir en Facebook"
                    >
                      <Facebook className="group-hover:scale-110 transition-transform" size={24} />
                    </button>
                    <button 
                      onClick={shareOnX}
                      className="aspect-square bg-slate-50 text-slate-900 rounded-2xl flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all group"
                      title="Compartir en X"
                    >
                      <Twitter className="group-hover:scale-110 transition-transform" size={24} />
                    </button>
                    <button 
                      onClick={copyToClipboard}
                      className={`aspect-square rounded-2xl flex items-center justify-center transition-all group ${shareStatus === 'copied' ? 'bg-emerald-600 text-white' : 'bg-violet-50 text-violet-600 hover:bg-violet-600 hover:text-white'}`}
                      title="Copiar enlace"
                    >
                      {shareStatus === 'copied' ? <Check size={24} /> : <LinkIcon className="group-hover:scale-110 transition-transform" size={24} />}
                    </button>
                  </div>
                  {shareStatus === 'copied' && (
                    <p className="text-[10px] font-bold text-emerald-600 mt-2 text-center animate-pulse">¡Enlace copiado al portapapeles!</p>
                  )}
                </div>
              </div>

              <div className="mt-8 p-6 bg-sky-50 rounded-3xl border border-sky-100 flex gap-4">
                <ShieldCheck size={24} className="text-sky-600 shrink-0" />
                <p className="text-[10px] font-bold text-sky-800 uppercase tracking-widest leading-relaxed">
                  Donación 100% segura. Tu apoyo llega directamente a la causa.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetail;

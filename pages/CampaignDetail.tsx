
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Users, Heart, Share2, ShieldCheck, User, MessageCircle, Check, AlertCircle, Copy } from 'lucide-react';
import { CampaignService } from '../services/CampaignService';
import { CampaignData } from '../types';

const CampaignDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [donating, setDonating] = useState(false);
  const [donationAmount, setDonationAmount] = useState<number>(5000);
  
  // Campos de donación
  const [donorName, setDonorName] = useState<string>('');
  const [donorComment, setDonorComment] = useState<string>('');
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'shared'>('idle');
  const [error, setError] = useState<string | null>(null);

  const service = CampaignService.getInstance();

  useEffect(() => {
    const fetchDetail = async () => {
      if (id) {
        try {
          const data = await service.getCampaignById(id);
          setCampaign(data);
        } catch (err) {
          console.error("Error cargando detalle:", err);
        }
      }
      setLoading(false);
    };
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
      
      const updated = await service.getCampaignById(campaign.id);
      setCampaign(updated);
      
      // Feedback de éxito
      alert("¡Tu donación ha sido recibida! Muchas gracias por apoyar esta causa.");
      
      // Reset campos
      setDonorName('');
      setDonorComment('');
      setDonationAmount(5000);
    } catch (e: any) {
      setError(e.message || "No pudimos procesar la donación en este momento.");
    } finally {
      setDonating(false);
    }
  };

  const handleShare = async () => {
    if (!campaign) return;
    
    const shareData = {
      title: `Donia: ${campaign.titulo}`,
      text: `Mira esta causa en Donia: "${campaign.titulo}". ¡Tu ayuda cuenta!`,
      url: window.location.href,
    };

    // Lógica robusta para compartir
    try {
      if (navigator.share && typeof navigator.share === 'function') {
        await navigator.share(shareData);
        setShareStatus('shared');
        setTimeout(() => setShareStatus('idle'), 3000);
      } else {
        await copyToClipboard();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        await copyToClipboard();
      }
    }
  };

  const copyToClipboard = async () => {
    try {
      // Intenta usar la API moderna de portapapeles
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(window.location.href);
      } else {
        // Fallback para entornos no seguros o navegadores antiguos
        const textArea = document.createElement("textarea");
        textArea.value = window.location.href;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 3000);
    } catch (err) {
      alert("Enlace: " + window.location.href);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <span className="text-violet-600 font-black uppercase tracking-widest text-sm">Abriendo causa...</span>
    </div>
  );

  if (!campaign) return (
    <div className="p-20 text-center max-w-xl mx-auto">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
        <AlertCircle size={40} />
      </div>
      <h2 className="text-3xl font-black text-slate-900 mb-4">Ups, no encontramos esta causa</h2>
      <p className="text-slate-500 mb-8 font-medium">Es posible que el enlace haya expirado o la campaña ya no esté activa.</p>
      <button onClick={() => navigate('/explorar')} className="bg-violet-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-violet-700 transition-all">
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
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-8 leading-tight tracking-tight">{campaign.titulo}</h1>
            
            <div className="relative rounded-[40px] overflow-hidden mb-12 shadow-2xl bg-slate-200 group">
              <img src={campaign.imagenUrl} alt={campaign.titulo} className="w-full aspect-video object-cover group-hover:scale-[1.01] transition-transform duration-700" />
              <div className="absolute bottom-6 left-6">
                <span className="bg-sky-500 text-white font-black px-5 py-2 rounded-full text-xs uppercase tracking-widest shadow-xl">
                  {campaign.categoria}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-sm border border-slate-100">
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
                  <span className="font-bold text-slate-700">{campaign.donantesCount} personas han donado</span>
                </div>
              </div>

              <div className="prose prose-lg max-w-none">
                <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Acerca de esta campaña</h2>
                <div className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap">
                  {campaign.historia}
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
                  <div className="h-full bg-gradient-to-r from-violet-600 to-sky-400 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex justify-between mt-3">
                   <span className="text-xs font-black text-violet-600">{progress.toFixed(0)}% de la meta</span>
                   <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">Pesos (CLP)</span>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3 items-center text-rose-700 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle size={18} className="shrink-0" />
                  <p className="text-xs font-bold leading-tight">{error}</p>
                </div>
              )}

              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-3">
                  {[3000, 5000, 10000].map(amt => (
                    <button 
                      key={amt}
                      onClick={() => setDonationAmount(amt)}
                      className={`py-3 rounded-2xl text-xs font-black border-2 transition-all ${donationAmount === amt ? 'bg-violet-600 border-violet-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-500 hover:border-violet-200'}`}
                    >
                      ${amt.toLocaleString()}
                    </button>
                  ))}
                </div>
                
                <div className="space-y-4">
                  <div className="relative group">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black group-focus-within:text-violet-600 transition-colors">$</span>
                    <input 
                      type="number" 
                      className="w-full pl-10 pr-5 py-4 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-2xl outline-none font-black text-slate-900 transition-all text-sm"
                      placeholder="Monto"
                      value={donationAmount || ''}
                      onChange={(e) => setDonationAmount(Number(e.target.value))}
                    />
                  </div>

                  <div className="relative group">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-600 transition-colors" size={18} />
                    <input 
                      type="text" 
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-2xl outline-none font-bold text-slate-700 transition-all text-sm"
                      placeholder="Tu nombre (Opcional)"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                    />
                  </div>

                  <div className="relative group">
                    <MessageCircle className="absolute left-5 top-4 text-slate-400 group-focus-within:text-violet-600 transition-colors" size={18} />
                    <textarea 
                      rows={2}
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-2xl outline-none font-medium text-slate-600 transition-all text-sm resize-none"
                      placeholder="Mensaje de apoyo..."
                      value={donorComment}
                      onChange={(e) => setDonorComment(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  onClick={handleDonate}
                  disabled={donating || donationAmount < 500}
                  className={`w-full py-5 rounded-[24px] font-black text-xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-violet-100 ${donating || donationAmount < 500 ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-violet-600 text-white hover:bg-violet-700 hover:-translate-y-1 active:scale-95'}`}
                >
                  {donating ? 'Procesando...' : <><Heart size={24} className="fill-current" /> Donar ahora</>}
                </button>

                <div className="relative">
                  <button 
                    onClick={handleShare}
                    className={`w-full py-4 font-bold rounded-2xl border-2 flex items-center justify-center gap-2 transition-all ${
                      shareStatus !== 'idle'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm' 
                      : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50 active:scale-95'
                    }`}
                  >
                    {shareStatus === 'copied' ? (
                      <><Check size={18} /> ¡Copiado!</>
                    ) : shareStatus === 'shared' ? (
                      <><Check size={18} /> ¡Compartido!</>
                    ) : (
                      <><Share2 size={18} /> Compartir causa</>
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-8 p-6 bg-sky-50 rounded-3xl border border-sky-100 flex gap-4">
                <div className="text-sky-600 shrink-0">
                   <ShieldCheck size={24} />
                </div>
                <p className="text-[10px] font-bold text-sky-800 leading-relaxed uppercase tracking-widest">
                  Donación 100% segura. Tu apoyo llega directamente a quienes lo necesitan.
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

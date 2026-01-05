
import React, { useEffect, useState, useRef } from 'react';
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
  Check,
  CreditCard,
  Loader2,
  Lock,
  ArrowRight
} from 'lucide-react';
import { CampaignService } from '../services/CampaignService';
import { CampaignData, Donation } from '../types';

declare global {
  interface Window {
    MercadoPago: any;
  }
}

const CampaignDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [donationAmount, setDonationAmount] = useState<number>(5000);
  
  const [donorName, setDonorName] = useState<string>('');
  const [donorComment, setDonorComment] = useState<string>('');
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'rejected' | 'pending'>('idle');

  const paymentBrickContainerRef = useRef<HTMLDivElement>(null);
  const brickInstanceRef = useRef<any>(null);
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

  useEffect(() => {
    if (showPaymentForm && window.MercadoPago && paymentBrickContainerRef.current && campaign) {
      const mp = new window.MercadoPago(process.env.REACT_APP_MP_PUBLIC_KEY, {
        locale: 'es-CL'
      });
      const bricksBuilder = mp.bricks();

      const renderPaymentBrick = async () => {
        if (paymentBrickContainerRef.current) paymentBrickContainerRef.current.innerHTML = '';
        
        try {
          brickInstanceRef.current = await bricksBuilder.create('payment', 'paymentBrick_container', {
            initialization: {
              amount: donationAmount,
            },
            customization: {
              paymentMethods: {
                creditCard: 'all',
                debitCard: 'all',
                mercadoPago: 'all',
              },
              visual: {
                style: { theme: 'flat' },
                borderRadius: '16px',
              }
            },
            callbacks: {
              onSubmit: async ({ formData }: any) => {
                try {
                  const result = await service.processPayment(
                    formData, 
                    campaign.id, 
                    { nombre: donorName, comentario: donorComment }
                  );
                  
                  if (result.status === 'approved') {
                    setPaymentStatus('success');
                    fetchDetail();
                  } else {
                    setPaymentStatus('rejected');
                  }
                } catch (e: any) {
                  setError(e.message || "Error procesando el pago.");
                }
              },
              onError: (error: any) => {
                console.error("Error en Brick:", error);
                setError("Error al cargar la pasarela.");
              }
            }
          });
        } catch (e) {
          console.error("Error renderizando brick:", e);
        }
      };

      renderPaymentBrick();
    }
  }, [showPaymentForm, donationAmount, campaign]);

  const handleStartDonation = () => {
    if (donationAmount < 500) {
      setError("Monto mínimo: $500 CLP");
      return;
    }
    setError(null);
    setShowPaymentForm(true);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000);
    } catch (err) {
      console.error("Error al copiar:", err);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <Loader2 className="w-10 h-10 text-violet-600 animate-spin mb-3" />
      <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Cargando historia...</span>
    </div>
  );

  if (!campaign) return (
    <div className="py-20 text-center max-w-md mx-auto px-6">
      <AlertCircle size={32} className="mx-auto mb-4 text-slate-300" />
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Causa no encontrada</h2>
      <button onClick={() => navigate('/explorar')} className="text-violet-600 font-bold underline">Explorar otras causas</button>
    </div>
  );

  const progress = Math.min((campaign.recaudado / campaign.monto) * 100, 100);

  if (paymentStatus === 'success') {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
          <Check size={40} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-3">¡Gracias por donar!</h1>
        <p className="text-slate-500 mb-10 font-medium">Tu aporte para <span className="text-violet-600 font-bold">{campaign.beneficiarioNombre}</span> fue recibido con éxito.</p>
        <button onClick={() => { setPaymentStatus('idle'); setShowPaymentForm(false); }} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold">Volver</button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-slate-400 hover:text-violet-600 font-bold mb-6 transition-colors group text-sm">
          <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" /> Volver
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Principal */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 leading-tight tracking-tight">{campaign.titulo}</h1>
            
            <div className="relative rounded-3xl overflow-hidden mb-8 shadow-lg bg-slate-200">
              <img src={campaign.imagenUrl} alt={campaign.titulo} className="w-full aspect-video object-cover" />
              <div className="absolute top-4 left-4">
                <span className="bg-violet-600 text-white font-black px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest shadow-md">
                  {campaign.categoria}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 mb-8">
              <div className="flex flex-wrap gap-6 mb-8 pb-6 border-b border-slate-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center text-violet-600">
                    <MapPin size={16} />
                  </div>
                  <span className="font-bold text-slate-600 text-sm">{campaign.ubicacion}</span>
                </div>
                <div className="flex items-center gap-2.5">
                   <div className="w-8 h-8 bg-sky-50 rounded-lg flex items-center justify-center text-sky-600">
                    <Users size={16} />
                  </div>
                  <span className="font-bold text-slate-600 text-sm">{campaign.donantesCount} donantes</span>
                </div>
              </div>

              <div className="mb-10">
                <h2 className="text-xl font-black text-slate-900 mb-4 tracking-tight">La historia</h2>
                <div className="text-slate-600 leading-relaxed text-base whitespace-pre-wrap font-medium">
                  {campaign.historia}
                </div>
              </div>

              <div className="bg-sky-50 rounded-2xl p-5 border border-sky-100 flex items-center gap-4">
                <ShieldCheck size={24} className="text-sky-600 shrink-0" />
                <div>
                  <h3 className="font-black text-sky-900 uppercase text-[10px] tracking-widest">Causa Verificada</h3>
                  <p className="text-sky-800 text-xs font-medium">
                    Fondos para <span className="font-black">{campaign.beneficiarioNombre}</span> ({campaign.beneficiarioRelacion}).
                  </p>
                </div>
              </div>
            </div>

            {/* Mensajes */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
                <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                  <MessageCircle size={20} className="text-violet-600" />
                  Mensajes de apoyo
                </h2>
                
                <div className="space-y-4">
                  {campaign.donations && campaign.donations.length > 0 ? (
                    campaign.donations.map((don: Donation) => (
                      <div key={don.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-violet-600 font-black text-[10px] border border-slate-100 shadow-sm">
                              {don.nombreDonante.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-black text-slate-800 text-xs">{don.nombreDonante}</p>
                              <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                                <Calendar size={8} />
                                {new Date(don.fecha).toLocaleDateString('es-CL')}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                            +${don.monto?.toLocaleString('es-CL')}
                          </span>
                        </div>
                        {don.comentario && (
                          <p className="text-slate-500 text-sm font-medium italic ml-11 border-l-2 border-slate-200 pl-3">
                            "{don.comentario}"
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-6 text-slate-400 font-bold text-sm">Aún no hay mensajes de apoyo.</p>
                  )}
                </div>
            </div>
          </div>

          {/* Sidebar de Donación */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-white rounded-3xl p-6 md:p-7 shadow-xl shadow-slate-200/50 border border-slate-100">
              <div className="mb-6">
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1 block">Recaudado</span>
                    <span className="text-3xl font-black text-slate-900">${campaign.recaudado.toLocaleString('es-CL')}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1 block">Meta</span>
                    <span className="text-sm font-bold text-slate-500">${campaign.monto.toLocaleString('es-CL')}</span>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-violet-600 to-sky-400 rounded-full" style={{ width: `${progress}%` }} />
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl flex gap-2 items-center text-rose-700 text-[11px] font-bold">
                  <AlertCircle size={14} />
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-5">
                {!showPaymentForm ? (
                  <>
                    <div className="space-y-3">
                      <div className="relative">
                         <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-300 text-sm">$</span>
                         <input 
                            type="number" 
                            className="w-full pl-7 pr-4 py-3 bg-slate-50 border border-slate-100 focus:border-violet-200 focus:bg-white rounded-xl outline-none font-black text-slate-900 transition-all text-sm"
                            placeholder="Monto a donar"
                            value={donationAmount || ''}
                            onChange={(e) => setDonationAmount(Number(e.target.value))}
                          />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[3000, 5000, 10000].map(amt => (
                          <button 
                            key={amt}
                            onClick={() => setDonationAmount(amt)}
                            className={`py-2 rounded-xl text-[10px] font-black border transition-all ${donationAmount === amt ? 'bg-violet-600 border-violet-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-500 hover:border-violet-200'}`}
                          >
                            ${amt.toLocaleString()}
                          </button>
                        ))}
                      </div>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:border-violet-200 focus:bg-white rounded-xl outline-none font-bold text-slate-700 transition-all text-sm"
                        placeholder="Nombre (opcional)"
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                      />
                      <textarea 
                        rows={2}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:border-violet-200 focus:bg-white rounded-xl outline-none font-medium text-slate-600 resize-none transition-all text-sm"
                        placeholder="Mensaje..."
                        value={donorComment}
                        onChange={(e) => setDonorComment(e.target.value)}
                      />
                    </div>

                    <button 
                      onClick={handleStartDonation}
                      className="w-full py-4 rounded-2xl font-black text-base bg-violet-600 text-white hover:bg-violet-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-100"
                    >
                      Donar ahora <ArrowRight size={18} />
                    </button>
                  </>
                ) : (
                  <div className="bg-slate-50 p-5 rounded-2xl border border-violet-100 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-black text-slate-900 text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                        <CreditCard size={12} className="text-violet-600" /> Checkout
                      </h4>
                      <button onClick={() => setShowPaymentForm(false)} className="text-[9px] font-black text-violet-600 uppercase underline">Editar</button>
                    </div>
                    <div className="flex justify-between items-center mb-4 bg-white p-3 rounded-xl border border-slate-100">
                      <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Total</span>
                      <span className="text-lg font-black text-violet-600">${donationAmount.toLocaleString('es-CL')}</span>
                    </div>
                    <div id="paymentBrick_container" ref={paymentBrickContainerRef} className="min-h-[250px]"></div>
                    <p className="mt-4 text-[8px] text-center text-slate-400 font-black uppercase tracking-widest flex items-center justify-center gap-1.5">
                      <Lock size={8} /> Pago Protegido
                    </p>
                  </div>
                )}

                <div className="pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Compartir</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(campaign.titulo + " " + window.location.href)}`, '_blank')} className="flex-1 aspect-square bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all"><MessageCircle size={18} /></button>
                    <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')} className="flex-1 aspect-square bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"><Facebook size={18} /></button>
                    <button onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`, '_blank')} className="flex-1 aspect-square bg-slate-50 text-slate-900 rounded-xl flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all"><Twitter size={18} /></button>
                    <button onClick={copyToClipboard} className={`flex-1 aspect-square rounded-xl flex items-center justify-center transition-all ${shareStatus === 'copied' ? 'bg-emerald-600 text-white' : 'bg-violet-50 text-violet-600 hover:bg-violet-600 hover:text-white'}`}>{shareStatus === 'copied' ? <Check size={18} /> : <LinkIcon size={18} />}</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetail;

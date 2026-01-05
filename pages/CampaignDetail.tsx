
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
  ArrowRight,
  X,
  MessageSquare
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
  
  const [showAllMessages, setShowAllMessages] = useState(false);

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
            initialization: { amount: donationAmount },
            customization: {
              paymentMethods: { creditCard: 'all', debitCard: 'all', mercadoPago: 'all' },
              visual: { style: { theme: 'flat' }, borderRadius: '16px' }
            },
            callbacks: {
              onSubmit: async ({ formData }: any) => {
                try {
                  const result = await service.processPayment(formData, campaign.id, { nombre: donorName, comentario: donorComment });
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
  const limitedDonations = campaign.donations?.slice(0, 5) || [];
  const totalDonations = campaign.donations?.length || 0;

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
    <div className="bg-slate-50 min-h-screen pb-16 relative">
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
                <span className="bg-violet-600 text-white font-black px-4 py-1.5 rounded-full text-xs uppercase tracking-widest shadow-md">
                  {campaign.categoria}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-100 mb-8">
              <div className="flex flex-wrap gap-8 mb-10 pb-6 border-b border-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-violet-50 rounded-lg flex items-center justify-center text-violet-600">
                    <MapPin size={18} />
                  </div>
                  <span className="font-bold text-slate-700 text-sm">{campaign.ubicacion}</span>
                </div>
                <div className="flex items-center gap-3">
                   <div className="w-9 h-9 bg-sky-50 rounded-lg flex items-center justify-center text-sky-600">
                    <Users size={18} />
                  </div>
                  <span className="font-bold text-slate-700 text-sm">{campaign.donantesCount} donantes</span>
                </div>
              </div>

              <div className="mb-10">
                <h2 className="text-xl font-black text-slate-900 mb-5 tracking-tight">La historia</h2>
                <div className="text-slate-600 leading-relaxed text-base whitespace-pre-wrap font-medium">
                  {campaign.historia}
                </div>
              </div>

              <div className="bg-sky-50 rounded-2xl p-6 border border-sky-100 flex items-center gap-4">
                <ShieldCheck size={32} className="text-sky-600 shrink-0" />
                <div>
                  <h3 className="font-black text-sky-900 uppercase text-xs tracking-widest mb-1">Causa Verificada</h3>
                  <p className="text-sky-800 text-sm font-medium">
                    Los fondos serán destinados a <span className="font-black underline">{campaign.beneficiarioNombre}</span> ({campaign.beneficiarioRelacion}).
                  </p>
                </div>
              </div>
            </div>

            {/* Mensajes de apoyo con fuentes más legibles */}
            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <MessageCircle size={22} className="text-violet-600" />
                    Mensajes de apoyo ({totalDonations})
                  </h2>
                </div>
                
                <div className="space-y-4">
                  {totalDonations > 0 ? (
                    <>
                      {limitedDonations.map((don: Donation) => (
                        <div key={don.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 transition-colors hover:bg-white hover:border-violet-100">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-violet-600 font-black text-xs border border-slate-100 shadow-sm uppercase">
                                {don.nombreDonante.charAt(0)}
                              </div>
                              <div>
                                <p className="font-black text-slate-900 text-sm">{don.nombreDonante}</p>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                  <Calendar size={10} />
                                  {new Date(don.fecha).toLocaleDateString('es-CL')}
                                </div>
                              </div>
                            </div>
                            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                              +${don.monto?.toLocaleString('es-CL')}
                            </span>
                          </div>
                          {don.comentario && (
                            <p className="text-slate-600 text-base font-medium italic ml-14 border-l-2 border-slate-200 pl-4">
                              "{don.comentario}"
                            </p>
                          )}
                        </div>
                      ))}
                      
                      {totalDonations > 5 && (
                        <button 
                          onClick={() => setShowAllMessages(true)}
                          className="w-full py-5 mt-2 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 font-black text-xs uppercase tracking-widest hover:border-violet-300 hover:text-violet-600 transition-all flex items-center justify-center gap-2"
                        >
                          Ver los {totalDonations} mensajes <ArrowRight size={16} />
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <MessageSquare className="mx-auto text-slate-200 mb-3" size={40} />
                      <p className="text-slate-400 font-bold text-base">Aún no hay mensajes. ¡Sé el primero!</p>
                    </div>
                  )}
                </div>
            </div>
          </div>

          {/* Sidebar de Donación */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
              <div className="mb-8">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <span className="text-slate-400 text-[11px] font-black uppercase tracking-widest mb-1.5 block">Recaudado</span>
                    <span className="text-3xl font-black text-slate-900">${campaign.recaudado.toLocaleString('es-CL')}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[11px] font-black uppercase tracking-widest mb-1.5 block">Meta</span>
                    <span className="text-base font-bold text-slate-500">${campaign.monto.toLocaleString('es-CL')}</span>
                  </div>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-violet-600 to-sky-400 rounded-full shadow-inner" style={{ width: `${progress}%` }} />
                </div>
              </div>

              {error && (
                <div className="mb-5 p-4 bg-rose-50 border border-rose-100 rounded-xl flex gap-3 items-center text-rose-700 text-xs font-bold">
                  <AlertCircle size={16} />
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-6">
                {!showPaymentForm ? (
                  <>
                    <div className="space-y-4">
                      <div className="relative group">
                         <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300 text-base group-focus-within:text-violet-400">$</span>
                         <input 
                            type="number" 
                            className="w-full pl-8 pr-4 py-4 bg-slate-50 border border-slate-100 focus:border-violet-200 focus:bg-white rounded-xl outline-none font-black text-slate-900 transition-all text-base"
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
                            className={`py-3 rounded-xl text-xs font-black border transition-all ${donationAmount === amt ? 'bg-violet-600 border-violet-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-500 hover:border-violet-200'}`}
                          >
                            ${amt.toLocaleString()}
                          </button>
                        ))}
                      </div>
                      <input 
                        type="text" 
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-violet-200 focus:bg-white rounded-xl outline-none font-bold text-slate-700 transition-all text-sm"
                        placeholder="Nombre (opcional)"
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                      />
                      <textarea 
                        rows={2}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-violet-200 focus:bg-white rounded-xl outline-none font-medium text-slate-600 resize-none transition-all text-sm"
                        placeholder="Escribe un mensaje..."
                        value={donorComment}
                        onChange={(e) => setDonorComment(e.target.value)}
                      />
                    </div>

                    <button 
                      onClick={handleStartDonation}
                      className="w-full py-5 rounded-2xl font-black text-lg bg-violet-600 text-white hover:bg-violet-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-violet-100 active:scale-95"
                    >
                      Donar ahora <ArrowRight size={20} />
                    </button>
                  </>
                ) : (
                  <div className="bg-slate-50 p-6 rounded-2xl border border-violet-100 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest flex items-center gap-1.5">
                        <CreditCard size={14} className="text-violet-600" /> Formulario de Pago
                      </h4>
                      <button onClick={() => setShowPaymentForm(false)} className="text-[10px] font-black text-violet-600 uppercase underline">Modificar</button>
                    </div>
                    <div className="flex justify-between items-center mb-6 bg-white p-5 rounded-xl border border-slate-100">
                      <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Total Donación</span>
                      <span className="text-xl font-black text-violet-600">${donationAmount.toLocaleString('es-CL')}</span>
                    </div>
                    <div id="paymentBrick_container" ref={paymentBrickContainerRef} className="min-h-[250px]"></div>
                    <p className="mt-5 text-[10px] text-center text-slate-400 font-black uppercase tracking-widest flex items-center justify-center gap-1.5">
                      <Lock size={10} /> Transacción Encriptada
                    </p>
                  </div>
                )}

                <div className="pt-8 border-t border-slate-100">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-5 block">Compartir causa</span>
                  <div className="flex gap-3">
                    <button onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(campaign.titulo + " " + window.location.href)}`, '_blank')} className="flex-1 aspect-square bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><MessageCircle size={22} /></button>
                    <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')} className="flex-1 aspect-square bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Facebook size={22} /></button>
                    <button onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`, '_blank')} className="flex-1 aspect-square bg-slate-50 text-slate-900 rounded-xl flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all shadow-sm"><Twitter size={22} /></button>
                    <button onClick={copyToClipboard} className={`flex-1 aspect-square rounded-xl flex items-center justify-center transition-all shadow-sm ${shareStatus === 'copied' ? 'bg-emerald-600 text-white' : 'bg-violet-50 text-violet-600 hover:bg-violet-600 hover:text-white'}`}>{shareStatus === 'copied' ? <Check size={22} /> : <LinkIcon size={22} />}</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Ver todos los mensajes */}
      {showAllMessages && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAllMessages(false)}></div>
          
          <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl relative z-10 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Header del Modal */}
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-[32px]">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Todos los mensajes</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Historial de apoyo ({totalDonations})</p>
              </div>
              <button 
                onClick={() => setShowAllMessages(false)}
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:rotate-90 transition-all border border-slate-100"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Cuerpo del Modal con Scroll */}
            <div className="flex-grow overflow-y-auto p-8 space-y-5 custom-scrollbar">
              {campaign.donations?.map((don: Donation) => (
                <div key={don.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-violet-600 font-black text-xs border border-slate-100 shadow-sm uppercase">
                        {don.nombreDonante.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-sm">{don.nombreDonante}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          <Calendar size={10} />
                          {new Date(don.fecha).toLocaleDateString('es-CL')}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                      +${don.monto?.toLocaleString('es-CL')}
                    </span>
                  </div>
                  {don.comentario && (
                    <p className="text-slate-600 text-base font-medium italic ml-14 border-l-2 border-slate-200 pl-4">
                      "{don.comentario}"
                    </p>
                  )}
                </div>
              ))}
            </div>
            
            {/* Footer del Modal */}
            <div className="p-7 border-t border-slate-100 text-center">
              <button 
                onClick={() => setShowAllMessages(false)}
                className="text-violet-600 font-black text-sm uppercase tracking-widest hover:underline"
              >
                Cerrar ventana
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estilos para scrollbar del modal */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
};

export default CampaignDetail;

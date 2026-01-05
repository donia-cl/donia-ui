
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Heart, 
  CreditCard, 
  Loader2, 
  Lock, 
  ArrowRight,
  AlertCircle,
  Info,
  Check,
  Zap,
  Receipt
} from 'lucide-react';
import { CampaignService } from '../services/CampaignService';
import { CampaignData } from '../types';

// Declare MercadoPago on the window object to avoid TypeScript property errors
declare global {
  interface Window {
    MercadoPago: any;
  }
}

const DonatePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [donationAmount, setDonationAmount] = useState<number>(5000);
  const [tipPercentage, setTipPercentage] = useState<number>(10);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  
  const [donorName, setDonorName] = useState<string>('');
  const [donorComment, setDonorComment] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'rejected'>('idle');

  const paymentBrickContainerRef = useRef<HTMLDivElement>(null);
  const service = CampaignService.getInstance();

  // Lógica de cálculos corregida: IVA solo sobre el aporte a Donia
  const tipSubtotal = Math.round(donationAmount * (tipPercentage / 100));
  const ivaAmount = Math.round(tipSubtotal * 0.19);
  const totalAmount = donationAmount + tipSubtotal + ivaAmount;

  useEffect(() => {
    const fetchCampaign = async () => {
      if (id) {
        const data = await service.getCampaignById(id);
        setCampaign(data);
      }
      setLoading(false);
    };
    fetchCampaign();
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
          await bricksBuilder.create('payment', 'paymentBrick_container', {
            initialization: { amount: totalAmount },
            customization: {
              paymentMethods: { creditCard: 'all', debitCard: 'all', mercadoPago: 'all' },
              visual: { style: { theme: 'flat' }, borderRadius: '16px' }
            },
            callbacks: {
              onSubmit: async ({ formData }: any) => {
                try {
                  const result = await service.processPayment(formData, campaign.id, { 
                    nombre: donorName, 
                    comentario: donorComment,
                    tip: tipSubtotal,
                    iva: ivaAmount
                  });
                  if (result.status === 'approved') {
                    setPaymentStatus('success');
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
  }, [showPaymentForm, totalAmount, campaign]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="w-10 h-10 text-violet-600 animate-spin mb-4" />
      <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Preparando checkout...</span>
    </div>
  );

  if (!campaign) return <div className="p-20 text-center text-slate-500 font-bold">Causa no encontrada</div>;

  if (paymentStatus === 'success') {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
          <Check size={40} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-3">¡Donación exitosa!</h1>
        <p className="text-slate-500 mb-10 font-medium leading-relaxed">
          Tu aporte voluntario para <span className="text-violet-600 font-bold">{campaign.titulo}</span> ha sido procesado correctamente.
        </p>
        <button 
          onClick={() => navigate(`/campana/${campaign.id}`)} 
          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black"
        >
          Volver a la campaña
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <div className="max-w-5xl mx-auto px-4 pt-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-slate-400 hover:text-violet-600 font-bold mb-8 transition-colors group text-sm">
          <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" /> Volver a la campaña
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Formulario Izquierda */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white rounded-[32px] p-8 md:p-10 shadow-sm border border-slate-100">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-600 shadow-sm">
                  <Heart size={24} className="fill-current" />
                </div>
                <div>
                   <h1 className="text-2xl font-black text-slate-900 tracking-tight">Estás apoyando a:</h1>
                   <p className="text-slate-500 font-bold text-sm line-clamp-1">{campaign.titulo}</p>
                </div>
              </div>

              {!showPaymentForm ? (
                <div className="space-y-8">
                  {/* Selección de Monto */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Monto de tu donación base</label>
                    <div className="relative mb-4">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xl">$</span>
                      <input 
                        type="number" 
                        className="w-full pl-9 pr-4 py-5 bg-slate-50 border border-slate-100 focus:border-violet-200 focus:bg-white rounded-2xl outline-none font-black text-slate-900 transition-all text-xl"
                        placeholder="0"
                        value={donationAmount || ''}
                        onChange={(e) => setDonationAmount(Number(e.target.value))}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[3000, 5000, 10000].map(amt => (
                        <button 
                          key={amt}
                          onClick={() => setDonationAmount(amt)}
                          className={`py-3 rounded-xl text-sm font-black border transition-all ${donationAmount === amt ? 'bg-violet-600 border-violet-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-500 hover:border-violet-200 shadow-sm'}`}
                        >
                          ${amt.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Propina Donia */}
                  <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                      <Zap size={80} className="text-violet-600" />
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-2">
                         Apoyo a la plataforma Donia
                      </h3>
                      <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6 pr-10">
                        Donia no cobra comisiones a los organizadores. Tu aporte voluntario nos permite seguir operando de forma gratuita para las causas.
                      </p>
                      
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        {[10, 15, 20].map(pct => (
                          <button 
                            key={pct}
                            onClick={() => setTipPercentage(pct)}
                            className={`py-2 rounded-xl text-[11px] font-black border transition-all ${tipPercentage === pct ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 shadow-sm'}`}
                          >
                            {pct}%
                          </button>
                        ))}
                        <button 
                           onClick={() => setTipPercentage(0)}
                           className={`py-2 rounded-xl text-[11px] font-black border transition-all ${tipPercentage === 0 ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 shadow-sm'}`}
                        >
                           0%
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <input 
                      type="text" 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-violet-200 focus:bg-white rounded-xl outline-none font-bold text-slate-700 transition-all text-sm"
                      placeholder="Tu nombre (opcional)"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                    />
                    <textarea 
                      rows={3}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-violet-200 focus:bg-white rounded-xl outline-none font-medium text-slate-600 resize-none transition-all text-sm"
                      placeholder="Mensaje de apoyo..."
                      value={donorComment}
                      onChange={(e) => setDonorComment(e.target.value)}
                    />
                  </div>

                  <button 
                    onClick={() => {
                      if (donationAmount < 500) {
                        setError("El monto mínimo de donación es $500 CLP");
                        return;
                      }
                      setError(null);
                      setShowPaymentForm(true);
                    }}
                    className="w-full py-5 rounded-2xl font-black text-lg bg-violet-600 text-white hover:bg-violet-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-violet-100"
                  >
                    Continuar al pago <ArrowRight size={20} />
                  </button>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-slate-900">Método de pago</h2>
                    <button 
                      onClick={() => setShowPaymentForm(false)}
                      className="text-violet-600 font-bold text-xs uppercase tracking-widest hover:underline"
                    >
                      Editar montos
                    </button>
                  </div>
                  
                  <div id="paymentBrick_container" ref={paymentBrickContainerRef} className="min-h-[300px]"></div>
                  
                  {error && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex gap-3 text-rose-700 text-xs font-bold items-center">
                      <AlertCircle size={16} />
                      <p>{error}</p>
                    </div>
                  )}

                  <p className="text-center text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center justify-center gap-2">
                    <Lock size={12} /> Pago seguro vía Mercado Pago
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Resumen Derecha */}
          <div className="lg:col-span-5 h-fit sticky top-24">
            <div className="bg-white rounded-[32px] p-8 md:p-10 shadow-xl shadow-slate-200/40 border border-violet-100 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-50/50 rounded-bl-[100px] -z-0 pointer-events-none"></div>
              
              <div className="relative z-10">
                <h2 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                  <Receipt className="text-violet-600" size={24} />
                  Resumen de tu aporte
                </h2>
                
                <div className="space-y-5 mb-10">
                  {/* Donación Base */}
                  <div className="flex justify-between items-center group">
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Aporte a la Causa</span>
                      <span className="text-slate-600 text-sm font-bold">100% para el beneficiario</span>
                    </div>
                    <span className="font-black text-slate-900 text-lg">${donationAmount.toLocaleString('es-CL')}</span>
                  </div>
                  
                  {/* Aporte Donia (Subtotal) */}
                  <div className="flex justify-between items-center group">
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Donia</span>
                      <span className="text-slate-600 text-sm font-bold">Aporte voluntario ({tipPercentage}%)</span>
                    </div>
                    <span className="font-black text-slate-900 text-lg">${tipSubtotal.toLocaleString('es-CL')}</span>
                  </div>

                  {/* IVA solo sobre el aporte Donia */}
                  <div className="flex justify-between items-center group">
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Impuestos</span>
                      <span className="text-slate-600 text-sm font-bold">IVA Aporte Donia (19%)</span>
                    </div>
                    <span className="font-black text-slate-900 text-lg">${ivaAmount.toLocaleString('es-CL')}</span>
                  </div>
                </div>
                
                <div className="pt-8 border-t-2 border-dashed border-slate-100 mb-8">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="font-black text-slate-400 uppercase text-[11px] tracking-[0.2em] mb-1 block">Total a pagar</span>
                      <span className="text-4xl font-black text-slate-900 tracking-tighter">${totalAmount.toLocaleString('es-CL')}</span>
                    </div>
                    <div className="bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 flex items-center gap-2">
                       <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                       <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Seguro</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl flex gap-4 items-start border border-slate-100">
                  <div className="bg-white p-2 rounded-lg shadow-sm text-violet-600">
                    <Info size={16} />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    El monto base solicitado va íntegro a la campaña. El IVA aplicado corresponde únicamente al aporte voluntario realizado a la plataforma Donia para cubrir gastos de operación.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonatePage;

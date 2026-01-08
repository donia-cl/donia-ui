
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Heart, 
  Loader2, 
  Lock, 
  ArrowRight,
  AlertCircle,
  Info,
  Check,
  Zap,
  Receipt,
  Mail,
  CreditCard
} from 'lucide-react';
import { CampaignService } from '../services/CampaignService';
import { CampaignData } from '../types';
import { useAuth } from '../context/AuthContext';

declare global {
  interface Window {
    MercadoPago: any;
  }
}

const DonatePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [donationAmount, setDonationAmount] = useState<number>(5000);
  const [tipPercentage, setTipPercentage] = useState<number | 'custom'>(10);
  const [customTipAmount, setCustomTipAmount] = useState<number>(0);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  
  const mpPublicKey = process.env.REACT_APP_MP_PUBLIC_KEY || '';
  
  const [donorName, setDonorName] = useState<string>('');
  const [donorEmail, setDonorEmail] = useState<string>('');
  const [donorComment, setDonorComment] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'rejected'>('idle');

  const paymentBrickContainerRef = useRef<HTMLDivElement>(null);
  const service = CampaignService.getInstance();

  // --- CÁLCULO FINANCIERO (IVA INCLUIDO) ---
  
  // 1. Calculamos el monto bruto de la propina
  const tipGrossAmount = tipPercentage === 'custom' 
    ? customTipAmount 
    : Math.round(donationAmount * (Number(tipPercentage) / 100));
    
  // 2. Desglosamos el IVA desde el bruto (Neto = Bruto / 1.19)
  const tipNetAmount = Math.round(tipGrossAmount / 1.19);
  
  // 3. Obtenemos el monto del IVA por diferencia
  const ivaAmount = tipGrossAmount - tipNetAmount;

  // 4. El total a pagar es la donación + la propina bruta
  const totalAmount = donationAmount + tipGrossAmount;

  // --- FUNCIÓN HELPER PARA STEP DINÁMICO ---
  const getDynamicStep = (val: number) => {
    if (!val || val === 0) return 500;
    // El step es el 10% del valor actual, con un mínimo de 100 pesos
    return Math.max(100, Math.floor(val / 10));
  };

  // Manejo manual de la propina
  const handleManualTipChange = (val: number) => {
    setCustomTipAmount(val);
    setTipPercentage('custom');
  };

  // Pre-llenar datos si el usuario está logueado
  useEffect(() => {
    if (user || profile) {
      if (profile?.full_name) setDonorName(profile.full_name);
      if (user?.email) setDonorEmail(user.email);
    }
  }, [user, profile]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (id) {
          const data = await service.getCampaignById(id);
          setCampaign(data);
        }
      } catch (e) {
        console.error("Error cargando campaña:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (showPaymentForm && window.MercadoPago && paymentBrickContainerRef.current && campaign && mpPublicKey) {
      const mp = new window.MercadoPago(mpPublicKey, {
        locale: 'es-CL'
      });
      const bricksBuilder = mp.bricks();

      const renderPaymentBrick = async () => {
        if (paymentBrickContainerRef.current) paymentBrickContainerRef.current.innerHTML = '';
        
        try {
          await bricksBuilder.create('payment', 'paymentBrick_container', {
            initialization: { 
              amount: totalAmount,
              payer: {
                email: donorEmail // Pasamos el email al brick para pre-llenar
              }
            },
            customization: {
              paymentMethods: { creditCard: 'all', debitCard: 'all', mercadoPago: 'all' },
              visual: { style: { theme: 'flat' }, borderRadius: '16px' }
            },
            callbacks: {
              onSubmit: async ({ formData }: any) => {
                try {
                  const result = await service.processPayment(formData, campaign.id, { 
                    nombre: donorName,
                    email: donorEmail, // OBLIGATORIO
                    comentario: donorComment,
                    tip: tipNetAmount, // Enviamos el Neto para registro contable
                    iva: ivaAmount,    // Enviamos el IVA para registro contable
                    donorUserId: user?.id || null 
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
                console.error("Error en Mercado Pago Brick:", error);
                setError("Error al cargar la pasarela de pagos.");
              }
            }
          });
        } catch (e) {
          console.error("Error renderizando brick:", e);
        }
      };
      renderPaymentBrick();
    }
  }, [showPaymentForm, totalAmount, campaign, mpPublicKey, donorEmail]);

  const handleSimulatePayment = async () => {
    if (!campaign) return;
    setProcessingPayment(true);
    setError(null);
    try {
      await service.simulateDonation({
        campaignId: campaign.id,
        monto: donationAmount, // Solo el monto de donación base, o totalAmount si quieres registrar todo
        nombre: donorName || 'Anónimo',
        email: donorEmail,
        comentario: donorComment,
        donorUserId: user?.id || null
      });
      setPaymentStatus('success');
    } catch (e: any) {
      setError(e.message || "Error al simular el pago.");
    } finally {
      setProcessingPayment(false);
    }
  };

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
        <p className="text-slate-500 mb-6 font-medium leading-relaxed">
          Tu aporte voluntario para <span className="text-violet-600 font-bold">{campaign.titulo}</span> ha sido procesado correctamente.
        </p>
        <div className="bg-slate-50 p-4 rounded-xl mb-10 text-sm text-slate-600 border border-slate-100">
           Hemos enviado un comprobante a <strong>{donorEmail}</strong>.
        </div>
        <button 
          onClick={() => navigate(`/campana/${campaign.id}`)} 
          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black"
        >
          Volver a la campaña
        </button>
      </div>
    );
  }

  const validateAndContinue = () => {
    if (donationAmount < 500) {
      setError("El monto mínimo de donación es $500 CLP");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!donorEmail || !emailRegex.test(donorEmail)) {
      setError("Por favor ingresa un correo electrónico válido.");
      return;
    }
    setError(null);
    setShowPaymentForm(true);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <div className="max-w-5xl mx-auto px-4 pt-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-slate-400 hover:text-violet-600 font-bold mb-8 transition-colors group text-sm">
          <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" /> Volver a la campaña
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
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
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Monto de tu donación base</label>
                    <div className="relative mb-4">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xl">$</span>
                      <input 
                        type="number" 
                        step={getDynamicStep(donationAmount)}
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

                  {/* SECCIÓN DE PROPINA MODIFICADA */}
                  <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                      <Zap size={80} className="text-violet-600" />
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-2">
                         Apoyo a la plataforma Donia
                      </h3>
                      <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6 pr-10">
                        Donia no cobra comisiones a los organizadores. Tu aporte voluntario (IVA incluido) permite mantener el sitio gratuito.
                      </p>
                      
                      {/* Botones de Porcentaje */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {[10, 15, 20].map(pct => (
                          <button 
                            key={pct}
                            onClick={() => setTipPercentage(pct)}
                            className={`py-3 rounded-xl text-xs font-black border transition-all ${tipPercentage === pct ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 shadow-sm'}`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>

                      {/* Input Manual siempre visible */}
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Monto del aporte</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-300 text-sm">$</span>
                          <input 
                            type="number"
                            step={getDynamicStep(tipGrossAmount)}
                            className={`w-full pl-8 pr-4 py-3 border rounded-xl outline-none font-bold text-slate-700 text-sm focus:border-violet-300 transition-all ${
                              tipPercentage === 'custom' ? 'bg-white border-violet-200' : 'bg-slate-100 border-transparent text-slate-500'
                            }`}
                            placeholder="Monto de aporte (IVA incluido)"
                            value={tipGrossAmount || ''}
                            onChange={(e) => handleManualTipChange(Number(e.target.value))}
                          />
                        </div>
                        {tipPercentage !== 'custom' && tipGrossAmount > 0 && (
                          <p className="text-[10px] text-slate-400 mt-1.5 ml-1 italic">
                            Calculado automáticamente ({tipPercentage}%). Escribe para cambiarlo.
                          </p>
                        )}
                      </div>

                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Email (Obligatorio)</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input 
                          type="email" 
                          required
                          className="w-full pl-11 px-5 py-4 bg-slate-50 border border-slate-100 focus:border-violet-200 focus:bg-white rounded-xl outline-none font-bold text-slate-900 transition-all text-sm"
                          placeholder="tu@correo.com"
                          value={donorEmail}
                          onChange={(e) => setDonorEmail(e.target.value)}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 ml-1">Necesario para enviarte el comprobante.</p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Tu nombre (Opcional)</label>
                      <input 
                        type="text" 
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-violet-200 focus:bg-white rounded-xl outline-none font-bold text-slate-900 transition-all text-sm"
                        placeholder="Ej: Juan Pérez"
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                      />
                    </div>
                    
                    <textarea 
                      rows={3}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-violet-200 focus:bg-white rounded-xl outline-none font-medium text-slate-600 resize-none transition-all text-sm"
                      placeholder="Escribe un mensaje de apoyo..."
                      value={donorComment}
                      onChange={(e) => setDonorComment(e.target.value)}
                    />
                  </div>

                  {error && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex gap-3 text-rose-700 text-xs font-bold items-center animate-in slide-in-from-top-1">
                      <AlertCircle size={16} />
                      <p>{error}</p>
                    </div>
                  )}

                  <button 
                    onClick={validateAndContinue}
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
                      Editar datos
                    </button>
                  </div>
                  
                  {/* Container de Mercado Pago */}
                  <div id="paymentBrick_container" ref={paymentBrickContainerRef} className="min-h-[100px]"></div>

                  {/* Botón de Simulación */}
                  <div className="pt-6 border-t border-slate-100">
                    <button
                      onClick={handleSimulatePayment}
                      disabled={processingPayment}
                      className="w-full py-5 rounded-2xl font-black text-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-100 active:scale-95 disabled:opacity-70 disabled:cursor-wait"
                    >
                      {processingPayment ? (
                         <>
                           <Loader2 className="animate-spin" size={24} />
                           Procesando...
                         </>
                      ) : (
                         <>
                           <CreditCard size={24} />
                           Pagar ahora (Simulación)
                         </>
                      )}
                    </button>
                    <p className="text-center text-[10px] text-slate-400 font-bold mt-2">
                      * Modo de pruebas activado: No se realizará cargo real.
                    </p>
                  </div>
                  
                  {error && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex gap-3 text-rose-700 text-xs font-bold items-center">
                      <AlertCircle size={16} />
                      <p>{error}</p>
                    </div>
                  )}

                  <p className="text-center text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center justify-center gap-2">
                    <Lock size={12} /> Pago seguro vía Donia
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 h-fit sticky top-24">
            <div className="bg-white rounded-[32px] p-8 md:p-10 shadow-xl shadow-slate-200/40 border border-violet-100 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-50/50 rounded-bl-[100px] -z-0 pointer-events-none"></div>
              
              <div className="relative z-10">
                <h2 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                  <Receipt className="text-violet-600" size={24} />
                  Resumen de tu aporte
                </h2>
                
                <div className="space-y-5 mb-10">
                  <div className="flex justify-between items-center group">
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Aporte a la Causa</span>
                      <span className="text-slate-600 text-sm font-bold">100% para el beneficiario</span>
                    </div>
                    <span className="font-black text-slate-900 text-lg">${donationAmount.toLocaleString('es-CL')}</span>
                  </div>
                  
                  <div className="flex justify-between items-center group">
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Aporte Donia</span>
                      <span className="text-slate-600 text-sm font-bold">Neto {tipPercentage !== 'custom' && tipPercentage !== 0 && `(${tipPercentage}%)`}</span>
                    </div>
                    <span className="font-black text-slate-900 text-lg">${tipNetAmount.toLocaleString('es-CL')}</span>
                  </div>

                  <div className="flex justify-between items-center group">
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Impuestos</span>
                      <span className="text-slate-600 text-sm font-bold">IVA Incluido (19%)</span>
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
                    El IVA ya está incluido dentro del aporte voluntario seleccionado. No se agregarán cargos adicionales al total mostrado.
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

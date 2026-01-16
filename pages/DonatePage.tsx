
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ChevronLeft, 
  Heart, 
  Loader2, 
  Lock, 
  ArrowRight, 
  AlertCircle, 
  Zap, 
  Receipt, 
  Mail, 
  Check, 
  ShieldCheck,
  XCircle,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { CampaignService } from '../services/CampaignService';
import { CampaignData } from '../types';
import { useAuth } from '../context/AuthContext';

const DonatePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [donationAmount, setDonationAmount] = useState<number>(5000);
  const [tipPercentage, setTipPercentage] = useState<number | 'custom'>(10);
  const [customTipAmount, setCustomTipAmount] = useState<number>(0);
  
  const [redirecting, setRedirecting] = useState(false);
  const [donorName, setDonorName] = useState<string>('');
  const [donorEmail, setDonorEmail] = useState<string>('');
  const [donorComment, setDonorComment] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  // Detectar estado desde la URL (Retorno de Mercado Pago)
  const queryParams = new URLSearchParams(location.search);
  const paymentStatus = queryParams.get('status'); 
  const collectionStatus = queryParams.get('collection_status');
  const finalStatus = paymentStatus || collectionStatus;

  const service = CampaignService.getInstance();

  useEffect(() => {
    setRedirecting(false);
    const handlePageShow = () => setRedirecting(false);
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [location.pathname]);

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
    if (user || profile) {
      if (profile?.full_name) setDonorName(profile.full_name);
      if (user?.email) setDonorEmail(user.email);
    }
  }, [user, profile]);

  const tipGrossAmount = tipPercentage === 'custom' 
    ? customTipAmount 
    : Math.round(donationAmount * (Number(tipPercentage) / 100));
  
  const commissionAmount = Math.round((donationAmount + tipGrossAmount) * 0.038);
  const totalAmount = donationAmount + tipGrossAmount + commissionAmount;

  const handleManualTipChange = (strVal: string) => {
    const cleanVal = strVal.replace(/\./g, '').replace(/\D/g, '');
    const numVal = cleanVal === '' ? 0 : parseInt(cleanVal, 10);
    setCustomTipAmount(numVal);
    setTipPercentage('custom');
  };

  const handleDonationChange = (strVal: string) => {
    const cleanVal = strVal.replace(/\./g, '').replace(/\D/g, '');
    const numVal = cleanVal === '' ? 0 : parseInt(cleanVal, 10);
    setDonationAmount(numVal);
  };

  const handlePaymentRedirect = async () => {
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
    setRedirecting(true);

    try {
        const resp = await fetch('/api/preference?action=preference', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                campaignId: campaign?.id,
                campaignTitle: campaign?.titulo,
                monto: totalAmount,
                nombre: donorName,
                email: donorEmail,
                comentario: donorComment,
                donorUserId: user?.id || null
            })
        });
        const data = await resp.json();
        
        if (data.success && data.init_point) {
            window.location.href = data.init_point;
        } else {
            throw new Error(data.error || "No se pudo preparar la pasarela de pago.");
        }
    } catch (err: any) {
        setError(`Error al conectar con Mercado Pago: ${err.message}`);
        setRedirecting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="w-10 h-10 text-violet-600 animate-spin mb-4" />
      <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Preparando...</span>
    </div>
  );

  if (!campaign) return <div className="p-20 text-center text-slate-500 font-bold">Causa no encontrada</div>;

  // --- PANTALLA DE ÉXITO ---
  if (finalStatus === 'approved' || finalStatus === 'success') {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center animate-in zoom-in duration-300">
        <div className="relative mb-8">
           <div className="absolute inset-0 bg-emerald-100 rounded-full blur-2xl opacity-40 scale-150 animate-pulse"></div>
           <div className="relative w-24 h-24 bg-emerald-500 text-white rounded-[32px] flex items-center justify-center mx-auto shadow-xl shadow-emerald-200">
             <Check size={48} strokeWidth={3} />
           </div>
        </div>
        
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">¡Muchas gracias! 💜</h1>
        <p className="text-slate-500 mb-8 font-medium leading-relaxed text-lg">
          Tu donación para <br/><span className="text-violet-600 font-black text-xl">"{campaign.titulo}"</span><br/> se ha procesado con éxito.
        </p>
        
        <div className="bg-white p-8 rounded-[32px] mb-10 border border-slate-100 shadow-xl shadow-slate-200/50">
           <div className="flex justify-between items-center pb-4 border-b border-slate-50 mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Comprobante enviado a</span>
              <span className="text-sm font-bold text-slate-700">{donorEmail || 'Tu correo'}</span>
           </div>
           <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Monto total</span>
              <span className="text-2xl font-black text-slate-900">${totalAmount.toLocaleString('es-CL')}</span>
           </div>
        </div>

        <button 
          onClick={() => navigate(`/campana/${campaign.id}`)} 
          className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
        >
          Volver a la campaña
        </button>
      </div>
    );
  }

  // --- PANTALLA DE ERROR / FALLO ---
  if (finalStatus === 'failure' || finalStatus === 'rejected') {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center animate-in zoom-in duration-300">
        <div className="w-24 h-24 bg-rose-100 text-rose-500 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-sm">
          <XCircle size={48} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-4">Donación no realizada</h1>
        <p className="text-slate-500 mb-10 font-medium leading-relaxed">
          Mercado Pago no pudo procesar tu transacción. Esto puede deberse a fondos insuficientes o rechazo de tu banco.
        </p>
        
        <div className="space-y-4">
          <button 
            onClick={() => navigate(`/campana/${campaign.id}/donar`)} 
            className="w-full bg-violet-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-violet-700 transition-all shadow-xl shadow-violet-100"
          >
            Intentar nuevamente
          </button>
          <button 
            onClick={() => navigate(`/campana/${campaign.id}`)} 
            className="w-full bg-white text-slate-500 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} /> Cancelar y volver
          </button>
        </div>
      </div>
    );
  }

  // --- PANTALLA DE PENDIENTE ---
  if (finalStatus === 'pending' || finalStatus === 'in_process') {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center animate-in zoom-in duration-300">
        <div className="w-24 h-24 bg-amber-100 text-amber-500 rounded-[32px] flex items-center justify-center mx-auto mb-8 animate-pulse">
          <Clock size={48} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-4">Pago pendiente</h1>
        <p className="text-slate-500 mb-10 font-medium leading-relaxed">
          Tu donación está siendo procesada por el medio de pago. Te enviaremos un correo electrónico apenas se confirme el éxito de la operación.
        </p>
        <button 
          onClick={() => navigate(`/campana/${campaign.id}`)} 
          className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl"
        >
          Entendido
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <div className="max-w-5xl mx-auto px-4 pt-10">
        <button onClick={() => navigate(`/campana/${id}`)} className="flex items-center gap-1.5 text-slate-400 hover:text-violet-600 font-bold mb-8 transition-colors group text-sm">
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
                   <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tu donación</h1>
                   <p className="text-slate-500 font-bold text-sm line-clamp-1">Apoyando a: {campaign.titulo}</p>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Monto base</label>
                  <div className="relative mb-4">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xl">$</span>
                    <input 
                      type="text" 
                      className="w-full pl-9 pr-4 py-5 bg-slate-50 border border-slate-100 focus:border-violet-200 focus:bg-white rounded-2xl outline-none font-black text-slate-900 transition-all text-xl"
                      placeholder="0"
                      value={donationAmount > 0 ? donationAmount.toLocaleString('es-CL') : ''}
                      onChange={(e) => handleDonationChange(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[3000, 5000, 10000].map(amt => (
                      <button 
                        key={amt}
                        onClick={() => setDonationAmount(amt)}
                        className={`py-3 rounded-xl text-sm font-black border transition-all ${donationAmount === amt ? 'bg-violet-600 border-violet-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-500 hover:border-violet-200 shadow-sm'}`}
                      >
                        ${amt.toLocaleString('es-CL')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                    <Zap size={80} className="text-violet-600" />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-2">
                       Aporte voluntario a Donia
                    </h3>
                    <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6 pr-10">
                      Donia no cobra comisión al creador. Tu propina permite mantener este sitio 100% gratuito para quienes más lo necesitan.
                    </p>
                    
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

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-300 text-sm">$</span>
                      <input 
                        type="text"
                        className={`w-full pl-8 pr-4 py-3 border rounded-xl outline-none font-bold text-slate-700 text-sm focus:border-violet-300 transition-all ${
                          tipPercentage === 'custom' ? 'bg-white border-violet-200' : 'bg-slate-100 border-transparent text-slate-500'
                        }`}
                        placeholder="Monto de aporte personalizado"
                        value={tipGrossAmount > 0 ? tipGrossAmount.toLocaleString('es-CL') : ''}
                        onChange={(e) => handleManualTipChange(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input 
                      type="email" 
                      required
                      className="w-full pl-11 px-5 py-4 bg-slate-50 border border-slate-100 focus:border-violet-200 focus:bg-white rounded-xl outline-none font-bold text-slate-900 transition-all text-sm"
                      placeholder="Correo electrónico (obligatorio)"
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                    />
                  </div>

                  <input 
                    type="text" 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-violet-200 focus:bg-white rounded-xl outline-none font-bold text-slate-900 transition-all text-sm"
                    placeholder="Tu nombre (opcional)"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                  />
                  
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
                  onClick={handlePaymentRedirect}
                  disabled={redirecting}
                  className="w-full py-5 rounded-2xl font-black text-lg bg-violet-600 text-white hover:bg-violet-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-violet-100 disabled:opacity-70 disabled:cursor-wait active:scale-95"
                >
                  {redirecting ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Conectando con Mercado Pago...
                    </>
                  ) : (
                    <>
                      Continuar al pago seguro <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 h-fit sticky top-24">
            <div className="bg-white rounded-[32px] p-8 md:p-10 shadow-xl shadow-slate-200/40 border border-violet-100">
              <h2 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <Receipt className="text-violet-600" size={24} />
                Resumen del aporte
              </h2>
              
              <div className="space-y-5 mb-10">
                <div className="flex justify-between items-center group">
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Donación Causa</span>
                    <span className="text-slate-600 text-sm font-bold">100% íntegro para la historia</span>
                  </div>
                  <span className="font-black text-slate-900 text-lg">${donationAmount.toLocaleString('es-CL')}</span>
                </div>
                
                <div className="flex justify-between items-center group">
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Apoyo Donia</span>
                    <span className="text-slate-600 text-sm font-bold">Operación de la plataforma</span>
                  </div>
                  <span className="font-black text-slate-900 text-lg">${tipGrossAmount.toLocaleString('es-CL')}</span>
                </div>

                <div className="flex justify-between items-center group">
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Comisión de red</span>
                    <span className="text-slate-600 text-sm font-bold">Transbank y Mercado Pago</span>
                  </div>
                  <span className="font-black text-slate-900 text-lg">${commissionAmount.toLocaleString('es-CL')}</span>
                </div>
              </div>
              
              <div className="pt-8 border-t-2 border-dashed border-slate-100 mb-8">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="font-black text-slate-400 uppercase text-[11px] tracking-[0.2em] mb-1 block">Total final</span>
                    <span className="text-4xl font-black text-slate-900 tracking-tighter">${totalAmount.toLocaleString('es-CL')}</span>
                  </div>
                  <div className="bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 flex items-center gap-2">
                     <ShieldCheck size={14} className="text-emerald-600" />
                     <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Protegido</span>
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

export default DonatePage;


import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Calendar, Users, Heart, Share2, Info, ShieldCheck } from 'lucide-react';
import { CampaignService } from '../services/CampaignService';
import { CampaignData } from '../types';

const CampaignDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [donating, setDonating] = useState(false);
  const [donationAmount, setDonationAmount] = useState<number>(5000);
  const service = CampaignService.getInstance();

  useEffect(() => {
    const fetchDetail = async () => {
      if (id) {
        const data = await service.getCampaignById(id);
        setCampaign(data);
      }
      setLoading(false);
    };
    fetchDetail();
  }, [id]);

  const handleDonate = async () => {
    if (!campaign || donationAmount <= 0) return;
    setDonating(true);
    try {
      await service.donate(campaign.id, donationAmount);
      const updated = await service.getCampaignById(campaign.id);
      setCampaign(updated);
      alert("¡Gracias por tu generosidad!");
    } catch (e) {
      alert("Error al procesar.");
    } finally {
      setDonating(false);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-violet-600 font-bold">Cargando causa...</div>;
  if (!campaign) return <div className="p-20 text-center">Causa no encontrada.</div>;

  const progress = Math.min((campaign.recaudado / campaign.monto) * 100, 100);

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 pt-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-violet-600 font-bold mb-8 transition-colors">
          <ChevronLeft size={20} /> Volver
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-8 leading-tight tracking-tight">{campaign.titulo}</h1>
            
            <div className="relative rounded-[40px] overflow-hidden mb-12 shadow-2xl">
              <img src={campaign.imagenUrl} alt={campaign.titulo} className="w-full aspect-video object-cover" />
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
                  <span className="font-bold text-slate-700">{campaign.donantesCount} personas apoyando</span>
                </div>
              </div>

              <div className="prose prose-lg max-w-none">
                <h2 className="text-2xl font-black text-slate-900 mb-6">Nuestra historia</h2>
                <div className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap">
                  {campaign.historia}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-white rounded-[40px] p-10 shadow-xl shadow-violet-100/40 border border-violet-50">
              <div className="mb-8">
                <div className="flex justify-between items-end mb-4">
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Recaudado</span>
                    <span className="text-4xl font-black text-slate-900">${campaign.recaudado.toLocaleString('es-CL')}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Meta</span>
                    <span className="block text-lg font-bold text-slate-500">${campaign.monto.toLocaleString('es-CL')}</span>
                  </div>
                </div>
                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-gradient-to-r from-violet-600 to-sky-400 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex justify-between mt-3">
                   <span className="text-sm font-black text-violet-600">{progress.toFixed(0)}% completado</span>
                   <span className="text-sm font-bold text-slate-400">CLP</span>
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  {[5000, 10000, 20000].map(amt => (
                    <button 
                      key={amt}
                      onClick={() => setDonationAmount(amt)}
                      className={`py-3 rounded-2xl text-xs font-black border-2 transition-all ${donationAmount === amt ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white border-slate-100 text-slate-500 hover:border-violet-200'}`}
                    >
                      ${amt.toLocaleString()}
                    </button>
                  ))}
                </div>
                
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black">$</span>
                  <input 
                    type="number" 
                    className="w-full pl-10 pr-5 py-5 bg-slate-50 border-2 border-transparent focus:border-violet-600 focus:bg-white rounded-2xl outline-none font-black text-slate-900 transition-all"
                    placeholder="Monto personalizado"
                    value={donationAmount || ''}
                    onChange={(e) => setDonationAmount(Number(e.target.value))}
                  />
                </div>

                <button 
                  onClick={handleDonate}
                  disabled={donating || donationAmount < 500}
                  className={`w-full py-5 rounded-[24px] font-black text-xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-violet-100 ${donating ? 'bg-slate-200 text-slate-400 cursor-wait' : 'bg-violet-600 text-white hover:bg-violet-700 hover:-translate-y-1'}`}
                >
                  {donating ? 'Cargando...' : <><Heart size={24} className="fill-current" /> Donar ahora</>}
                </button>

                <button className="w-full py-4 bg-white text-slate-600 font-bold rounded-2xl border-2 border-slate-100 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                  <Share2 size={20} /> Compartir causa
                </button>
              </div>

              <div className="mt-8 p-6 bg-sky-50 rounded-3xl border border-sky-100 flex gap-4">
                <div className="text-sky-600 shrink-0">
                   <ShieldCheck size={24} />
                </div>
                <p className="text-xs font-medium text-sky-800 leading-relaxed">
                  Tu donación está protegida por el protocolo de <strong>Transparencia Donia</strong>. Los fondos se transfieren directamente tras la verificación.
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

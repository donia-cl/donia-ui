
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Rocket, 
  Heart, 
  Zap, 
  Banknote, 
  ShieldCheck, 
  BarChart3, 
  ArrowRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

const StepCard = ({ number, title, description, icon: Icon }: any) => (
  <div className="relative p-8 bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden">
    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
       <span className="text-9xl font-black">{number}</span>
    </div>
    <div className="relative z-10">
      <div className="w-14 h-14 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
        <Icon size={28} />
      </div>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-black text-violet-600 bg-violet-50 px-3 py-1 rounded-full uppercase tracking-widest">Paso {number}</span>
      </div>
      <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">{title}</h3>
      <p className="text-slate-500 font-medium leading-relaxed">{description}</p>
    </div>
  </div>
);

const About: React.FC = () => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-b from-violet-50/50 to-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100 mb-8">
             <Sparkles size={16} className="text-violet-500" />
             <span className="text-xs font-black text-slate-600 uppercase tracking-widest">¿Por qué Donia?</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
            Transparencia que <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-sky-500">genera comunidad.</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
            Nacimos para que ayudar sea simple, directo y sobre todo, honesto. 
            Conoce cómo transformamos la solidaridad en Chile.
          </p>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <StepCard 
              number="1"
              icon={Rocket}
              title="Crea tu campaña"
              description="Cuenta tu historia, define el objetivo y establece una meta. Es gratis y toma solo unos minutos."
            />
            <StepCard 
              number="2"
              icon={Heart}
              title="Recibe donaciones"
              description="Personas pueden donar de forma segura usando medios digitales. Van directo a tu causa."
            />
            <StepCard 
              number="3"
              icon={Zap}
              title="Donia sin comisiones"
              description="No cobramos comisión por donar. Nos sostenemos con propinas voluntarias de los donantes."
            />
            <StepCard 
              number="4"
              icon={Banknote}
              title="Retira los fondos"
              description="El beneficiario solicita el retiro directamente a su cuenta bancaria de forma simple."
            />
          </div>
        </div>
      </section>

      {/* Trust Banner - Updated from dark to light palette */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-white rounded-[40px] p-8 md:p-12 text-slate-900 relative overflow-hidden shadow-2xl shadow-violet-100/50 border border-violet-100">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-100/30 rounded-full blur-[100px] -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-100/30 rounded-full blur-[100px] -ml-32 -mb-32"></div>
            
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row items-center gap-12">
                <div className="md:w-1/2">
                  <h2 className="text-3xl font-black mb-6 tracking-tight text-slate-900">Compromiso Donia</h2>
                  <p className="text-slate-500 font-medium leading-relaxed mb-8">
                    La confianza es nuestra moneda principal. Hemos diseñado un sistema donde el control siempre lo tienes tú.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-violet-600 text-white p-1.5 rounded-lg">
                        <CheckCircle2 size={18} />
                      </div>
                      <span className="font-bold text-sm text-slate-700">Donia actúa únicamente como plataforma intermediaria</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-sky-500 text-white p-1.5 rounded-lg">
                        <CheckCircle2 size={18} />
                      </div>
                      <span className="font-bold text-sm text-slate-700">Todo el proceso es trazable y transparente</span>
                    </div>
                  </div>
                </div>
                
                <div className="md:w-1/2 grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <ShieldCheck className="text-emerald-500 mb-4" size={32} />
                    <h4 className="font-black text-xs uppercase tracking-widest mb-2 text-slate-400">Seguridad</h4>
                    <p className="text-slate-600 text-[11px] font-bold">Protocolos bancarios en cada transacción.</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <BarChart3 className="text-sky-500 mb-4" size={32} />
                    <h4 className="font-black text-xs uppercase tracking-widest mb-2 text-slate-400">Trazabilidad</h4>
                    <p className="text-slate-600 text-[11px] font-bold">Reportes claros de cada peso recaudado.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-16 text-center">
             <h3 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">¿Listo para marcar la diferencia?</h3>
             <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <Link to="/crear" className="bg-violet-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-violet-700 transition-all shadow-lg shadow-violet-100 flex items-center gap-2 group">
                  Crear mi campaña <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/explorar" className="text-slate-600 font-bold hover:text-violet-600 px-8 py-4 transition-colors">
                  Explorar causas
                </Link>
             </div>
          </div>
        </div>
      </section>

      <div className="h-20"></div>
    </div>
  );
};

export default About;

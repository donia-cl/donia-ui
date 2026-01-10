
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronDown, 
  ChevronLeft, 
  Search, 
  ShieldCheck, 
  Heart, 
  Megaphone, 
  CircleDollarSign, 
  Landmark, 
  RefreshCw, 
  Mail, 
  MapPin 
} from 'lucide-react';

const faqData = [
  {
    category: "Sobre Donia",
    icon: Heart,
    items: [
      { 
        q: "¿Qué es Donia?", 
        a: "Donia es una plataforma chilena que permite a personas naturales crear campañas solidarias para recaudar fondos de manera simple, transparente y segura. Donia actúa como intermediario tecnológico entre quienes donan y quienes reciben los fondos." 
      },
      { 
        q: "¿Donia es una fundación?", 
        a: "No. Donia es una plataforma digital privada. No es una fundación ni una entidad de beneficencia. Su rol es facilitar la recaudación de fondos entre personas." 
      }
    ]
  },
  {
    category: "Crear una campaña",
    icon: Megaphone,
    items: [
      { 
        q: "¿Necesito una cuenta para crear una campaña?", 
        a: "Puedes comenzar a crear tu campaña sin registrarte. Sin embargo, para publicarla y recibir donaciones debes crear una cuenta o iniciar sesión. Esto nos permite proteger a la comunidad y asegurar la correcta gestión de los fondos." 
      },
      { 
        q: "¿Qué información necesito para crear una campaña?", 
        a: "Para publicar una campaña debes ingresar:\n\n• Título y descripción de la campaña\n• Historia o motivo de la recaudación\n• Monto objetivo\n• Duración (30, 60 o 90 días)\n• Una imagen representativa\n\nAntes de publicar, también deberás aceptar los Términos y Condiciones de Donia." 
      },
      { 
        q: "¿Las campañas tienen una duración?", 
        a: "Sí. Todas las campañas tienen una duración definida de 30, 60 o 90 días, elegida por el creador.\nEn la página de la campaña se muestra:\n\n• Desde cuándo está activa\n• Cuántos días faltan para que termine" 
      },
      { 
        q: "¿Puedo editar mi campaña después de publicarla?", 
        a: "Sí, puedes editar ciertos contenidos (como la historia o imágenes). Algunos datos clave, como la duración o el monto objetivo, pueden tener restricciones una vez publicada la campaña." 
      }
    ]
  },
  {
    category: "Donaciones",
    icon: CircleDollarSign,
    items: [
      { 
        q: "¿Necesito una cuenta para donar?", 
        a: "No. Puedes donar sin crear una cuenta. Solo te pediremos un correo electrónico para enviarte el comprobante y poder contactarte en caso de cualquier problema con tu donación." 
      },
      { 
        q: "¿Cómo puedo donar?", 
        a: "Las donaciones se realizan mediante un sistema de pago seguro de Mercado Pago, usando tarjetas de crédito o débito.\nDonia no almacena ni tiene acceso a los datos de tu tarjeta.\n\nDonia nunca almacena los datos de tu tarjeta." 
      },
      { 
        q: "¿Las donaciones tienen comisión?", 
        a: "La donación completa va al beneficiario de la campaña.\nDe forma opcional, puedes agregar una propina para Donia, que nos permite mantener y operar la plataforma. Esta propina incluye IVA y se muestra de forma transparente antes de confirmar el pago." 
      },
      { 
        q: "¿Donia entrega boleta?", 
        a: "Sí. Donia emite boleta electrónica únicamente por la propina o comisión de la plataforma, no por el monto donado al beneficiario." 
      }
    ]
  },
  {
    category: "Fondos y retiros",
    icon: Landmark,
    items: [
      { 
        q: "¿Quién administra el dinero recaudado?", 
        a: "Los fondos son recaudados a través de Mercado Pago y administrados temporalmente por Donia, hasta que se transfieren al beneficiario de la campaña según las condiciones establecidas.\n\nDonia no es dueña de los fondos." 
      },
      { 
        q: "¿Cuándo se pueden retirar los fondos?", 
        a: "Por regla general, los fondos pueden retirarse una vez finalizada la campaña. Donia puede realizar validaciones adicionales antes de autorizar un retiro, con el objetivo de proteger a los donantes." 
      },
      { 
        q: "¿Cómo se realiza el retiro del dinero?", 
        a: "El retiro se realiza mediante transferencia bancaria a una cuenta a nombre del beneficiario de la campaña, quien deberá proporcionar sus datos personales y bancarios." 
      }
    ]
  },
  {
    category: "Seguridad y confianza",
    icon: ShieldCheck,
    items: [
      { 
        q: "¿Cómo protege Donia a los donantes?", 
        a: "Donia cuenta con:\n\n• Procesamiento de pagos seguro (Mercado Pago)\n• Validaciones técnicas y operativas\n• Posibilidad de pausar o cerrar campañas ante irregularidades\n• Registro y trazabilidad de donaciones" 
      },
      { 
        q: "¿Donia verifica a quienes crean campañas?", 
        a: "Donia solicita registro y validación de correo electrónico para publicar campañas. Además, puede solicitar información adicional en campañas de mayor riesgo o ante denuncias." 
      },
      { 
        q: "¿Qué pasa si una campaña tiene problemas o es fraudulenta?", 
        a: "Donia puede:\n\n• Pausar la campaña\n• Retener temporalmente los fondos\n• Realizar devoluciones a los donantes, cuando corresponda\n\nEsto está detallado en nuestros Términos y Condiciones." 
      }
    ]
  },
  {
    category: "Devoluciones",
    icon: RefreshCw,
    items: [
      { 
        q: "¿Puedo pedir la devolución de una donación?", 
        a: "Las devoluciones se evalúan caso a caso, especialmente cuando:\n\n• Una campaña es cancelada\n• Se detectan irregularidades\n• No se cumplen las condiciones informadas\n\nDonia hará los mayores esfuerzos por proteger a los donantes." 
      }
    ]
  },
  {
    category: "Soporte",
    icon: Mail,
    items: [
      { 
        q: "¿Cómo puedo contactar a Donia?", 
        a: "Puedes escribirnos a través de la sección de soporte del sitio o enviarnos un correo a nuestro canal de contacto. Respondemos lo antes posible." 
      }
    ]
  },
  {
    category: "Consideraciones generales",
    icon: MapPin,
    items: [
      { 
        q: "¿Donia funciona solo en Chile?", 
        a: "Sí. Actualmente Donia está disponible solo para campañas creadas por personas naturales en Chile y con donaciones en pesos chilenos (CLP)." 
      }
    ]
  }
];

const Help: React.FC = () => {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const toggleFAQ = (id: string) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  const filteredFaqs = faqData.map(cat => ({
    ...cat,
    items: cat.items.filter(item => 
      item.q.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.a.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-100 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-violet-600 font-bold mb-6 transition-colors group text-sm"
          >
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Volver
          </button>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">Centro de Ayuda</h1>
          <p className="text-slate-500 font-medium text-lg mb-8">¿Tienes dudas? Estamos aquí para resolverlas.</p>
          
          <div className="relative max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar una pregunta..." 
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none font-medium transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* FAQ List */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {filteredFaqs.length > 0 ? (
          <div className="space-y-12">
            {filteredFaqs.map((section, sIdx) => (
              <div key={sIdx} className="animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${sIdx * 100}ms` }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center">
                    <section.icon size={20} />
                  </div>
                  <h2 className="text-xl font-black text-slate-900">{section.category}</h2>
                </div>
                
                <div className="space-y-4">
                  {section.items.map((item, iIdx) => {
                    const id = `${sIdx}-${iIdx}`;
                    const isOpen = openIndex === id;
                    
                    return (
                      <div 
                        key={iIdx} 
                        className={`border rounded-2xl transition-all duration-300 ${isOpen ? 'bg-slate-50 border-violet-200 shadow-sm' : 'bg-white border-slate-100 hover:border-violet-100'}`}
                      >
                        <button 
                          onClick={() => toggleFAQ(id)}
                          className="w-full flex justify-between items-center p-6 text-left"
                        >
                          <span className={`font-bold text-base ${isOpen ? 'text-violet-700' : 'text-slate-700'}`}>{item.q}</span>
                          <ChevronDown size={20} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-violet-500' : ''}`} />
                        </button>
                        
                        <div 
                          className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                        >
                          <div className="px-6 pb-6 text-slate-600 font-medium leading-relaxed text-sm whitespace-pre-wrap">
                            {item.a}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-slate-400 font-bold">No encontramos resultados para "{searchTerm}"</p>
            <button onClick={() => setSearchTerm("")} className="text-violet-600 font-black mt-2 hover:underline">Ver todas las preguntas</button>
          </div>
        )}

        {/* Contact CTA */}
        <div className="mt-20 bg-slate-900 rounded-[32px] p-8 md:p-12 text-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl -ml-32 -mt-32"></div>
           <div className="absolute bottom-0 right-0 w-64 h-64 bg-sky-600/20 rounded-full blur-3xl -mr-32 -mb-32"></div>
           
           <div className="relative z-10">
             <h3 className="text-2xl font-black text-white mb-4">¿No encuentras lo que buscas?</h3>
             <p className="text-slate-400 font-medium mb-8 max-w-lg mx-auto">Nuestro equipo de soporte está listo para ayudarte con cualquier problema específico que tengas.</p>
             <button 
               onClick={() => navigate('/soporte')}
               className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black hover:bg-slate-100 transition-all shadow-lg active:scale-95"
             >
               Contactar a Soporte
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Help;


import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Send, Mail, MessageSquare, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Support: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    subject: '',
    message: ''
  });
  
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);

    try {
      // Validación local básica antes de enviar
      if (formData.message.length < 10) {
        throw new Error("El mensaje es muy corto. Por favor detalla más tu problema.");
      }

      // Conexión con el endpoint real
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Hubo un problema al enviar tu mensaje.");
      }

      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      console.error("Error envío soporte:", err);
      setError(err.message || "Error al enviar el mensaje. Inténtalo de nuevo.");
    } finally {
      setSending(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[32px] flex items-center justify-center mb-6 shadow-lg animate-in zoom-in duration-300">
          <CheckCircle2 size={40} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-4 text-center">¡Mensaje enviado!</h1>
        <p className="text-slate-500 font-medium text-center max-w-md mb-8 leading-relaxed">
          Hemos recibido tu solicitud. Nuestro equipo de soporte te responderá al correo proporcionado en un plazo máximo de 24 horas.
        </p>
        <div className="flex gap-4">
           <button 
             onClick={() => navigate('/')} 
             className="px-8 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-colors"
           >
             Volver al inicio
           </button>
           <button 
             onClick={() => setSuccess(false)} 
             className="px-8 py-3 bg-violet-600 text-white rounded-2xl font-black hover:bg-violet-700 transition-colors shadow-lg shadow-violet-100"
           >
             Enviar otro mensaje
           </button>
        </div>
      </div>
    );
  }

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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">Soporte Donia</h1>
              <p className="text-slate-500 font-medium">Cuéntanos qué sucede, estamos para ayudarte.</p>
            </div>
            
            <div className="flex gap-4">
               <a href="mailto:soporte@donia.cl" className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:text-violet-600 hover:border-violet-200 transition-all shadow-sm">
                 <Mail size={16} /> soporte@donia.cl
               </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          
          {/* Formulario */}
          <div className="md:col-span-7">
            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50">
               <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tu nombre</label>
                  <input 
                    type="text" 
                    required
                    className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-2xl outline-none font-bold text-slate-900 transition-all"
                    placeholder="Ej: Juan Pérez"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
               </div>
               
               <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Correo electrónico</label>
                  <input 
                    type="email" 
                    required
                    className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-2xl outline-none font-bold text-slate-900 transition-all"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
               </div>

               <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Asunto</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-2xl outline-none font-bold text-slate-900 transition-all cursor-pointer"
                    value={formData.subject}
                    onChange={e => setFormData({...formData, subject: e.target.value})}
                    required
                  >
                    <option value="" disabled>Selecciona un tema</option>
                    <option value="report">Reportar una campaña</option>
                    <option value="payment">Problema con un pago</option>
                    <option value="withdraw">Problema con retiros</option>
                    <option value="account">Acceso a mi cuenta</option>
                    <option value="other">Otro tema</option>
                  </select>
               </div>

               <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Mensaje</label>
                  <textarea 
                    required
                    rows={5}
                    className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-2xl outline-none font-medium text-slate-700 transition-all resize-none leading-relaxed"
                    placeholder="Describe tu problema con el mayor detalle posible..."
                    value={formData.message}
                    onChange={e => setFormData({...formData, message: e.target.value})}
                  />
               </div>

               {error && (
                 <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl flex items-center gap-3 text-sm font-bold border border-rose-100">
                   <AlertCircle size={18} />
                   {error}
                 </div>
               )}

               <button 
                 type="submit" 
                 disabled={sending}
                 className="w-full py-4 bg-violet-600 text-white rounded-2xl font-black text-lg hover:bg-violet-700 transition-all shadow-xl shadow-violet-100 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-wait active:scale-95"
               >
                 {sending ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                 {sending ? 'Enviando...' : 'Enviar mensaje'}
               </button>
            </form>
          </div>

          {/* Sidebar Info */}
          <div className="md:col-span-5 space-y-6">
             <div className="bg-sky-50 p-8 rounded-[32px] border border-sky-100">
                <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center mb-6">
                   <MessageSquare size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Chat en vivo</h3>
                <p className="text-slate-600 font-medium text-sm mb-6 leading-relaxed">
                  ¿Necesitas ayuda inmediata? Nuestro equipo está disponible de Lunes a Viernes, 9:00 a 18:00 hrs.
                </p>
                <button 
                  onClick={() => alert("El chat en vivo estará disponible pronto.")}
                  className="w-full py-3 bg-white text-sky-600 rounded-xl font-black text-sm border border-sky-200 hover:bg-sky-600 hover:text-white transition-all shadow-sm"
                >
                  Iniciar chat (Pronto)
                </button>
             </div>

             <div className="p-8 border border-slate-100 rounded-[32px]">
                <h3 className="font-black text-slate-900 mb-4">Preguntas Frecuentes</h3>
                <ul className="space-y-3">
                   <li>
                     <button onClick={() => navigate('/ayuda')} className="text-sm font-medium text-slate-500 hover:text-violet-600 hover:underline text-left">
                       ¿Cómo retiro mis fondos?
                     </button>
                   </li>
                   <li>
                     <button onClick={() => navigate('/ayuda')} className="text-sm font-medium text-slate-500 hover:text-violet-600 hover:underline text-left">
                       ¿Es seguro donar aquí?
                     </button>
                   </li>
                   <li>
                     <button onClick={() => navigate('/ayuda')} className="text-sm font-medium text-slate-500 hover:text-violet-600 hover:underline text-left">
                       ¿Qué comisiones cobran?
                     </button>
                   </li>
                </ul>
                <button 
                  onClick={() => navigate('/ayuda')}
                  className="mt-6 text-violet-600 font-black text-xs uppercase tracking-widest hover:underline"
                >
                  Ver Centro de Ayuda
                </button>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Support;


import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Loader2, AlertCircle, Heart } from 'lucide-react';
import { AuthService } from '../services/AuthService';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const authService = AuthService.getInstance();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });

  // Resetear estados de carga al entrar o volver a la página (soluciona el bloqueo por bfcache)
  useEffect(() => {
    const resetLoading = (event?: PageTransitionEvent) => {
      // Si event existe y es persistente, significa que viene del cache del navegador (botón atrás)
      setLoading(false);
      setGoogleLoading(false);
    };

    // Reset inmediato al montar
    resetLoading();

    // Escuchar el evento pageshow para detectar navegaciones de retroceso
    window.addEventListener('pageshow', resetLoading);
    
    return () => {
      window.removeEventListener('pageshow', resetLoading);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLogin && !acceptTerms) {
      setError("Debes aceptar los Términos y Condiciones para continuar.");
      return;
    }

    setLoading(true);
    setError(null);

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        await authService.signIn(formData.email, formData.password);
      } else {
        await authService.signUp(formData.email, formData.password, formData.fullName);
      }
      
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error("Auth error catch:", err);
      let msg = err.message || "Ocurrió un error inesperado.";
      if (msg.includes("User already registered")) msg = "Este correo ya está registrado. Intenta iniciar sesión.";
      if (msg.includes("Invalid login credentials")) msg = "Email o contraseña incorrectos.";
      if (msg.includes("Email not confirmed")) msg = "Debes confirmar tu correo electrónico antes de ingresar.";
      
      setError(msg);
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      await authService.signInWithGoogle();
      // La redirección ocurre aquí. Si el usuario vuelve atrás, el useEffect de arriba reseteará el estado.
    } catch (err: any) {
      console.error("Google Auth error:", err);
      setError(err.message || "No pudimos conectar con Google.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-50/30">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-600 text-white rounded-[24px] shadow-xl shadow-violet-100 mb-6 transition-transform hover:scale-110 duration-500">
            <Heart size={32} className="fill-current" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {isLogin ? 'Bienvenido a Donia' : 'Únete a la comunidad'}
          </h1>
          <p className="text-slate-500 font-medium mt-2">
            {isLogin ? 'Ingresa para gestionar tus campañas.' : 'Crea tu cuenta y comienza a ayudar.'}
          </p>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-[40px] shadow-2xl shadow-slate-200/40 border border-slate-100">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700 text-sm font-bold animate-in fade-in slide-in-from-top-1">
              <AlertCircle size={18} />
              <p>{error}</p>
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full py-4 px-6 bg-white border-2 border-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-center gap-3 mb-6 disabled:opacity-50 group"
          >
            {googleLoading ? (
              <Loader2 className="animate-spin text-violet-600" size={20} />
            ) : (
              <>
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuar con Google
              </>
            )}
          </button>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase font-black tracking-widest text-slate-300">
              <span className="bg-white px-4">o con tu email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="text"
                    required
                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-2xl outline-none font-bold text-slate-900 transition-all placeholder:text-slate-300"
                    placeholder="Tu nombre"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="email"
                  required
                  className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-2xl outline-none font-bold text-slate-900 transition-all placeholder:text-slate-300"
                  placeholder="ejemplo@correo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400">Contraseña</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="password"
                  required
                  className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-violet-200 focus:bg-white rounded-2xl outline-none font-bold text-slate-900 transition-all placeholder:text-slate-300"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            {!isLogin && (
              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      className="peer hidden"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                    />
                    <div className="w-5 h-5 border-2 border-slate-200 rounded-lg bg-white peer-checked:bg-violet-600 peer-checked:border-violet-600 transition-all"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-white scale-0 peer-checked:scale-100 transition-transform">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-500 leading-tight">
                    Acepto los <Link to="/terminos" target="_blank" className="text-violet-600 font-bold hover:underline">Términos y Condiciones</Link> de Donia.
                  </span>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading || (!isLogin && !acceptTerms)}
              className="w-full py-4 bg-violet-600 text-white rounded-2xl font-black text-lg hover:bg-violet-700 shadow-xl shadow-violet-100 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  {isLogin ? 'Ingresar' : 'Crear Cuenta'}
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-50 text-center">
            <p className="text-slate-500 font-medium">
              {isLogin ? '¿No tienes cuenta?' : '¿Ya eres parte de Donia?'}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 text-violet-600 font-black hover:underline"
              >
                {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;

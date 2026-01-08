
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Lock, Shield, Mail, Eye } from 'lucide-react';

const Privacy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Header decorativo */}
      <div className="bg-slate-50 border-b border-slate-100 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-violet-600 font-bold mb-6 transition-colors group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Volver
          </button>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-sky-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-sky-100">
              <Lock size={24} />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Privacidad</h1>
          </div>
          <p className="text-slate-500 font-medium">Política de Privacidad de Donia SpA</p>
        </div>
      </div>

      {/* Contenido Legal */}
      <div className="max-w-4xl mx-auto px-4 pt-12">
        <div className="prose prose-slate max-w-none">
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-10">
            Última actualización: 01 de agosto de 2026
          </p>

          <div className="space-y-12 text-slate-700 leading-relaxed font-medium">
            <section>
              <p>En Donia SpA valoramos y respetamos tu privacidad. Esta Política de Privacidad explica de manera clara qué datos personales recopilamos, cómo los utilizamos, cómo los protegemos y cuáles son tus derechos como usuario de nuestra plataforma.</p>
              <p className="mt-4">Al usar Donia, crear una cuenta, una campaña o realizar una donación, aceptas esta Política de Privacidad.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-sky-500">1.</span> ¿Quién es responsable de tus datos?
              </h2>
              <p><strong>Donia SpA</strong><br/>
              RUT: 76.653.829-9<br/>
              Domicilio: Av. Malaga 75, oficina 42.<br/>
              Correo de contacto: privacidad@donia.cl</p>
              <p className="mt-4">Donia SpA es la responsable del tratamiento de los datos personales recopilados a través de la plataforma www.donia.cl.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-sky-500">2.</span> ¿Qué datos personales recopilamos?
              </h2>
              <p>Recopilamos únicamente los datos necesarios para el correcto funcionamiento de la plataforma:</p>
              
              <div className="mt-4 pl-4 border-l-4 border-sky-100 space-y-4">
                <div>
                  <h4 className="font-bold text-slate-900">a) Datos de usuarios y creadores de campañas</h4>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Nombre y apellido</li>
                    <li>Correo electrónico</li>
                    <li>Información de contacto</li>
                    <li>Información de la campaña creada (descripción, objetivo, beneficiario, etc.)</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-bold text-slate-900">b) Datos de donantes</h4>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Nombre (opcional, según modalidad de donación)</li>
                    <li>Correo electrónico</li>
                    <li>Monto donado</li>
                    <li>Mensaje de apoyo (opcional)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900">c) Datos de pagos</h4>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Donia no almacena datos bancarios ni de tarjetas.</li>
                    <li>Los pagos son procesados directamente por proveedores externos de pago (por ejemplo, Mercado Pago), quienes manejan esta información bajo sus propias políticas de privacidad y estándares de seguridad.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900">d) Datos técnicos</h4>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Dirección IP</li>
                    <li>Tipo de navegador y dispositivo</li>
                    <li>Cookies y datos de uso del sitio</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-sky-500">3.</span> ¿Para qué usamos tus datos?
              </h2>
              <p>Usamos tus datos personales para:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Crear y administrar cuentas de usuario</li>
                <li>Permitir la creación y gestión de campañas</li>
                <li>Procesar donaciones y aportes voluntarios</li>
                <li>Facilitar el retiro de fondos por parte de los beneficiarios</li>
                <li>Enviar comunicaciones operativas relacionadas con el uso de Donia</li>
                <li>Prevenir fraudes y usos indebidos de la plataforma</li>
                <li>Cumplir obligaciones legales y regulatorias</li>
              </ul>
              <p className="mt-4 font-bold text-slate-900">Nunca utilizamos tus datos para fines distintos a los aquí descritos.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-sky-500">4.</span> Donaciones, fondos y rol de Donia
              </h2>
              <p>Donia actúa como una plataforma tecnológica intermediaria.</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Los fondos donados pertenecen al beneficiario de la campaña</li>
                <li>Donia no es dueña de los fondos</li>
              </ul>
              <p className="mt-4">Donia puede retener temporalmente los fondos solo para:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Procesamiento de pagos</li>
                <li>Prevención de fraudes</li>
                <li>Verificaciones de cumplimiento</li>
                <li>Cumplimiento de obligaciones legales</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-sky-500">5.</span> ¿Con quién compartimos tus datos?
              </h2>
              <p>Solo compartimos datos cuando es estrictamente necesario:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Proveedores de pago (ej. Mercado Pago) para procesar donaciones y retiros</li>
                <li>Proveedores tecnológicos (hosting, base de datos, infraestructura)</li>
                <li>Autoridades competentes, solo si la ley lo exige</li>
              </ul>
              <p className="mt-4 font-bold text-slate-900">Nunca vendemos ni comercializamos tus datos personales.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-sky-500">6.</span> Seguridad de la información
              </h2>
              <p>Aplicamos medidas técnicas y organizativas razonables para proteger tus datos personales, incluyendo:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Infraestructura segura</li>
                <li>Acceso restringido a la información</li>
                <li>Uso de proveedores certificados</li>
              </ul>
              <p className="mt-4">Aun así, ningún sistema es 100% infalible. Donia se compromete a actuar con diligencia ante cualquier incidente de seguridad.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-sky-500">7.</span> Derechos de los usuarios
              </h2>
              <p>De acuerdo con la Ley N°19.628, tienes derecho a:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Acceder a tus datos personales</li>
                <li>Rectificar datos incorrectos o desactualizados</li>
                <li>Solicitar la eliminación de tus datos</li>
                <li>Oponerte a ciertos usos de tus datos</li>
              </ul>
              <div className="mt-4 p-4 bg-slate-50 rounded-xl flex items-center gap-3">
                <Mail className="text-sky-500" size={20} />
                <p>Para ejercer estos derechos, puedes escribir a: <a href="mailto:privacidad@donia.cl" className="text-sky-600 font-bold hover:underline">privacidad@donia.cl</a></p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-sky-500">8.</span> Cookies
              </h2>
              <p>Donia utiliza cookies y tecnologías similares para:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Funcionamiento básico del sitio</li>
                <li>Seguridad</li>
                <li>Mejora de la experiencia de usuario</li>
              </ul>
              <p className="mt-4">Puedes configurar tu navegador para rechazar cookies, aunque algunas funcionalidades podrían verse afectadas.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-sky-500">9.</span> Cambios a esta Política de Privacidad
              </h2>
              <p>Donia puede actualizar esta Política de Privacidad cuando sea necesario. Los cambios serán publicados en el sitio y entrarán en vigencia desde su publicación.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-sky-500">10.</span> Contacto
              </h2>
              <p>Si tienes dudas sobre esta Política de Privacidad o sobre el uso de tus datos, puedes contactarnos en:</p>
              <a href="mailto:privacidad@donia.cl" className="block mt-2 text-xl font-bold text-sky-600 hover:underline">privacidad@donia.cl</a>
            </section>
          </div>
        </div>

        <div className="mt-20 p-8 bg-sky-50 rounded-[32px] border border-sky-100 flex flex-col items-center text-center">
          <Shield className="text-sky-500 mb-4" size={40} />
          <h3 className="text-lg font-black text-slate-900 mb-2 tracking-tight">Transparencia Total</h3>
          <p className="text-sm text-slate-500 font-medium max-w-lg">Tus datos están seguros y solo se utilizan para conectar corazones y causas.</p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;

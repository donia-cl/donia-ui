
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Scale, Shield } from 'lucide-react';

const Terms: React.FC = () => {
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
            <div className="w-12 h-12 bg-violet-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-violet-100">
              <Scale size={24} />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Legal</h1>
          </div>
          <p className="text-slate-500 font-medium">Términos y Condiciones de Uso de Donia</p>
        </div>
      </div>

      {/* Contenido Legal */}
      <div className="max-w-4xl mx-auto px-4 pt-12">
        <div className="prose prose-slate max-w-none">
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-10">
            Última actualización: 5 de enero de 2026
          </p>

          <div className="space-y-12 text-slate-700 leading-relaxed font-medium">
            <section>
              <p>Bienvenido/a a Donia. Estos Términos y Condiciones de Uso (en adelante, los "Términos") regulan el acceso y uso de la plataforma tecnológica Donia (el "Sitio" o la "Plataforma"), operada por Donia SpA (en adelante, "Donia"), disponible a través de su sitio web y/o aplicaciones asociadas.</p>
              <p className="mt-4">Al acceder, registrarte o utilizar Donia, declaras haber leído, entendido y aceptado estos Términos en su totalidad. Si no estás de acuerdo, debes abstenerte de utilizar la Plataforma.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-violet-600">1.</span> Definiciones
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Donante:</strong> Persona natural o jurídica que realiza un aporte voluntario a una campaña publicada en Donia.</li>
                <li><strong>Beneficiario:</strong> Persona natural o jurídica que crea una campaña y recibe los fondos recaudados.</li>
                <li><strong>Campaña:</strong> Iniciativa publicada en Donia con un objetivo específico de recaudación.</li>
                <li><strong>Aporte o Donación:</strong> Contribución voluntaria realizada por un Donante a una campaña.</li>
                <li><strong>Propina:</strong> Monto voluntario adicional pagado a Donia como retribución por el uso de la Plataforma.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-violet-600">2.</span> Naturaleza de Donia
              </h2>
              <p>Donia es una plataforma tecnológica de intermediación que facilita la conexión entre Donantes y Beneficiarios. Donia no es una institución financiera, banco, fundación ni entidad benéfica, y no actúa como representante, mandatario ni fiduciario de los usuarios.</p>
              <p className="mt-4">Los fondos recaudados pertenecen en todo momento al Beneficiario de la campaña, sin perjuicio de los plazos y condiciones técnicas necesarias para su procesamiento y retiro.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-violet-600">3.</span> Registro y uso de la Plataforma
              </h2>
              <p>Para crear campañas o realizar retiros de fondos, el usuario deberá registrarse y proporcionar información veraz, completa y actualizada. Donia podrá solicitar información adicional para verificar la identidad del usuario, en cumplimiento de obligaciones legales y de prevención de fraudes.</p>
              <p className="mt-4">El usuario es responsable de mantener la confidencialidad de sus credenciales de acceso y de todas las actividades realizadas desde su cuenta.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-violet-600">4.</span> Creación de campañas
              </h2>
              <p>El Beneficiario declara que la información publicada en su campaña es veraz, clara y no induce a error. Queda prohibido publicar campañas con fines ilícitos, engañosos, fraudulentos o contrarios a la ley chilena, la moral o el orden público.</p>
              <p className="mt-4">Donia se reserva el derecho de rechazar, suspender o eliminar campañas que infrinjan estos Términos, sin necesidad de expresión de causa.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-violet-600">5.</span> Aportes, donaciones y pagos
              </h2>
              <p>Los aportes realizados a través de Donia son voluntarios e irrevocables, salvo en los casos expresamente establecidos por la ley o por las políticas de los proveedores de pago.</p>
              <p className="mt-4">Los pagos se procesan a través de terceros proveedores (por ejemplo, Mercado Pago), cuyas condiciones y comisiones son aceptadas directamente por los usuarios al momento de realizar el pago.</p>
              <p className="mt-4">Donia no almacena ni procesa directamente información sensible de medios de pago.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-violet-600">6.</span> Propinas y modelo de ingresos
              </h2>
              <p>Donia podrá sugerir al Donante el pago de una propina voluntaria, destinada a financiar la operación y mantenimiento de la Plataforma.</p>
              <p className="mt-4 font-bold">La propina:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Es opcional y definida libremente por el Donante.</li>
                <li>Constituye un servicio prestado por Donia y puede estar afecta a impuestos según la legislación vigente.</li>
                <li>Será debidamente documentada conforme a la normativa tributaria aplicable.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-violet-600">7.</span> Uso de los fondos y responsabilidades
              </h2>
              <p>Donia no es beneficiaria de los fondos recaudados, los cuales están destinados exclusivamente al Beneficiario de cada campaña.</p>
              <p className="mt-4">El Beneficiario se compromete a utilizar los fondos recaudados de acuerdo con el propósito declarado públicamente en su campaña, actuando de buena fe y con responsabilidad frente a los Donantes.</p>
              <p className="mt-4">Donia podrá implementar medidas razonables de verificación, monitoreo o revisión de campañas, incluyendo la solicitud de antecedentes adicionales, con el objetivo de prevenir usos indebidos, fraudes o incumplimientos de estos Términos.</p>
              <p className="mt-4">No obstante lo anterior, Donia no garantiza ni asegura el uso final de los fondos por parte del Beneficiario, ni asume responsabilidad por el destino efectivo de los mismos, ya que este depende exclusivamente del Beneficiario.</p>
              <p className="mt-4">En caso de detectar indicios razonables de uso indebido, información falsa o incumplimiento de estos Términos, Donia se reserva el derecho de suspender la campaña, bloquear retiros pendientes y/o colaborar con las autoridades competentes, según corresponda.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-violet-600">8.</span> Retiros de fondos
              </h2>
              <p>El Beneficiario podrá solicitar el retiro de los fondos disponibles desde su cuenta, conforme a las condiciones, plazos y eventuales comisiones informadas en la Plataforma.</p>
              <p className="mt-4">Donia no garantiza plazos específicos de acreditación, los cuales dependen del proveedor de pagos y del sistema financiero.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-violet-600">9.</span> Limitación de responsabilidad
              </h2>
              <p>Donia no será responsable por:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>El éxito o fracaso de una campaña.</li>
                <li>El uso que el Beneficiario haga de los fondos.</li>
                <li>Disputas entre Donantes y Beneficiarios.</li>
                <li>Fallas atribuibles a terceros proveedores de servicios.</li>
              </ul>
              <p className="mt-4">En ningún caso Donia responderá por daños indirectos, lucro cesante o daño moral.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-violet-600">10.</span> Suspensión y cancelación de cuentas
              </h2>
              <p>Donia podrá suspender o cancelar cuentas que infrinjan estos Términos, sin perjuicio de las acciones legales que pudieran corresponder.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-violet-600">11.</span> Protección de datos personales
              </h2>
              <p>El tratamiento de los datos personales se rige por la Política de Privacidad de Donia y por la Ley N° 19.628 sobre Protección de la Vida Privada.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-violet-600">12.</span> Modificaciones
              </h2>
              <p>Donia podrá modificar estos Términos en cualquier momento. Las modificaciones serán informadas a través de la Plataforma y entrarán en vigencia desde su publicación.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-violet-600">13.</span> Ley aplicable y jurisdicción
              </h2>
              <p>Estos Términos se rigen por las leyes de la República de Chile. Cualquier controversia será sometida a los tribunales ordinarios de justicia con competencia en Santiago de Chile.</p>
            </section>
          </div>
        </div>

        <div className="mt-20 p-8 bg-violet-50 rounded-[32px] border border-violet-100 flex flex-col items-center text-center">
          <Shield className="text-violet-600 mb-4" size={40} />
          <h3 className="text-lg font-black text-slate-900 mb-2 tracking-tight">Tu seguridad es nuestra prioridad</h3>
          <p className="text-sm text-slate-500 font-medium max-w-lg">Si tienes dudas sobre estos términos o necesitas reportar una actividad inusual, no dudes en contactarnos.</p>
        </div>
      </div>
    </div>
  );
};

export default Terms;

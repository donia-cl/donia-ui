
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CampaignProvider } from './context/CampaignContext';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import Landing from './pages/Landing';
import Explore from './pages/Explore';
import About from './pages/About';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Auth from './pages/Auth';
import CampaignDetail from './pages/CampaignDetail';
import DonatePage from './pages/DonatePage';
import Dashboard from './pages/Dashboard';
import EditCampaign from './pages/EditCampaign';
import CreateIntro from './pages/wizard/Intro';
import CreateStory from './pages/wizard/Story';
import CreateDetails from './pages/wizard/Details';
import CreateReview from './pages/wizard/Review';
import Help from './pages/Help';
import Support from './pages/Support';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <CampaignProvider>
        <Router>
          <Layout>
            <Routes>
              {/* Ruta Principal: Landing Page */}
              <Route path="/" element={<Landing />} />
              
              {/* Rutas de la App */}
              <Route path="/login" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/campana/:id/editar" element={<EditCampaign />} />
              <Route path="/explorar" element={<Explore />} />
              <Route path="/acerca" element={<About />} />
              <Route path="/terminos" element={<Terms />} />
              <Route path="/privacidad" element={<Privacy />} />
              <Route path="/ayuda" element={<Help />} />
              <Route path="/soporte" element={<Support />} />
              <Route path="/campana/:id" element={<CampaignDetail />} />
              <Route path="/campana/:id/donar" element={<DonatePage />} />

              {/* Wizard Routes */}
              <Route path="/crear" element={<CreateIntro />} />
              <Route path="/crear/historia" element={<CreateStory />} />
              <Route path="/crear/detalles" element={<CreateDetails />} />
              <Route path="/crear/revisar" element={<CreateReview />} />

              {/* Fallback: Cualquier ruta desconocida lleva al inicio */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </Router>
      </CampaignProvider>
    </AuthProvider>
  );
};

export default App;

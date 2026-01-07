
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CampaignProvider } from './context/CampaignContext';
import { AuthProvider } from './context/AuthProvider';
import { Layout } from './components/Layout';
import Landing from './pages/Landing';
import Explore from './pages/Explore';
import About from './pages/About';
import Terms from './pages/Terms';
import Auth from './pages/Auth';
import CampaignDetail from './pages/CampaignDetail';
import DonatePage from './pages/DonatePage';
import Dashboard from './pages/Dashboard';
import EditCampaign from './pages/EditCampaign';
import CreateIntro from './pages/wizard/Intro';
import CreateStory from './pages/wizard/Story';
import CreateDetails from './pages/wizard/Details';
import CreateReview from './pages/wizard/Review';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <CampaignProvider>
        <Router>
          <Layout>
            <Routes>
              {/* Main Landing */}
              <Route path="/" element={<Landing />} />
              
              {/* Auth Flow */}
              <Route path="/login" element={<Auth />} />
              
              {/* Dashboard de Usuario */}
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Edición de Campaña */}
              <Route path="/campana/:id/editar" element={<EditCampaign />} />
              
              {/* Explore Campaigns */}
              <Route path="/explorar" element={<Explore />} />

              {/* About Page */}
              <Route path="/acerca" element={<About />} />

              {/* Terms and Conditions */}
              <Route path="/terminos" element={<Terms />} />
              
              {/* Campaign Detail */}
              <Route path="/campana/:id" element={<CampaignDetail />} />
              
              {/* Donation Flow */}
              <Route path="/campana/:id/donar" element={<DonatePage />} />

              {/* Wizard Routes */}
              <Route path="/crear" element={<CreateIntro />} />
              <Route path="/crear/historia" element={<CreateStory />} />
              <Route path="/crear/detalles" element={<CreateDetails />} />
              <Route path="/crear/revisar" element={<CreateReview />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </Router>
      </CampaignProvider>
    </AuthProvider>
  );
};

export default App;

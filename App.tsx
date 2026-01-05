
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { CampaignProvider } from './context/CampaignContext';
import { Layout } from './components/Layout';
import Landing from './pages/Landing';
import Explore from './pages/Explore';
import CampaignDetail from './pages/CampaignDetail';
import CreateIntro from './pages/wizard/Intro';
import CreateStory from './pages/wizard/Story';
import CreateDetails from './pages/wizard/Details';
import CreateReview from './pages/wizard/Review';

const App: React.FC = () => {
  return (
    <CampaignProvider>
      <Router>
        <Layout>
          <Routes>
            {/* Main Landing */}
            <Route path="/" element={<Landing />} />
            
            {/* Explore Campaigns */}
            <Route path="/explorar" element={<Explore />} />
            
            {/* Campaign Detail */}
            <Route path="/campana/:id" element={<CampaignDetail />} />

            {/* Wizard Routes */}
            <Route path="/crear" element={<CreateIntro />} />
            <Route path="/crear/historia" element={<CreateStory />} />
            <Route path="/crear/detalles" element={<CreateDetails />} />
            <Route path="/crear/revisar" element={<CreateReview />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
        <Analytics />
      </Router>
    </CampaignProvider>
  );
};

export default App;

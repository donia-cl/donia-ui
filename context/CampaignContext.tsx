
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CampaignData } from '../types';

interface CampaignContextType {
  // Use Partial<CampaignData> since the campaign is being constructed and lacks some fields initially
  campaign: Partial<CampaignData>;
  setCampaign: React.Dispatch<React.SetStateAction<Partial<CampaignData>>>;
  updateCampaign: (data: Partial<CampaignData>) => void;
  resetCampaign: () => void;
}

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

export const CampaignProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Fix: use Partial<CampaignData> as the initial state does not yet contain all required properties (id, recaudado, fechaCreacion)
  const [campaign, setCampaign] = useState<Partial<CampaignData>>({
    titulo: '',
    historia: '',
    monto: 0,
    categoria: 'Salud',
    ubicacion: 'Santiago, Chile'
  });

  const updateCampaign = (data: Partial<CampaignData>) => {
    setCampaign(prev => ({ ...prev, ...data }));
  };

  const resetCampaign = () => {
    // Fix: provide only the draft fields when resetting the wizard state
    setCampaign({
      titulo: '',
      historia: '',
      monto: 0,
      categoria: 'Salud',
      ubicacion: 'Santiago, Chile'
    });
  };

  return (
    <CampaignContext.Provider value={{ campaign, setCampaign, updateCampaign, resetCampaign }}>
      {children}
    </CampaignContext.Provider>
  );
};

export const useCampaign = () => {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error('useCampaign must be used within a CampaignProvider');
  }
  return context;
};


import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CampaignData } from '../types';

interface CampaignContextType {
  campaign: Partial<CampaignData>;
  setCampaign: React.Dispatch<React.SetStateAction<Partial<CampaignData>>>;
  updateCampaign: (data: Partial<CampaignData>) => void;
  resetCampaign: () => void;
}

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

const STORAGE_KEY = 'donia_campaign_draft';

export const CampaignProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state from localStorage if available
  const [campaign, setCampaign] = useState<Partial<CampaignData>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Error parsing saved campaign draft", e);
    }
    return {
      titulo: '',
      historia: '',
      monto: 0,
      categoria: 'Salud',
      ubicacion: 'Santiago, Chile',
      duracionDias: 60
    };
  });

  // Save to localStorage whenever campaign changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(campaign));
    } catch (e) {
      console.error("Error saving campaign draft", e);
    }
  }, [campaign]);

  const updateCampaign = (data: Partial<CampaignData>) => {
    setCampaign(prev => ({ ...prev, ...data }));
  };

  const resetCampaign = () => {
    const emptyState = {
      titulo: '',
      historia: '',
      monto: 0,
      categoria: 'Salud',
      ubicacion: 'Santiago, Chile',
      duracionDias: 60
    };
    setCampaign(emptyState);
    localStorage.removeItem(STORAGE_KEY);
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

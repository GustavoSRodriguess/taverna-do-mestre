// frontend/src/App.tsx - Com imports atualizados
import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DiceProvider } from './context/DiceContext';

import HomePage from './components/Home';
import Login from './components/Login/Login';
import ProtectedRoute from './components/Login/ProtectedRoute';
import ComponentDoc from './components/ComponentDoc';
import UserProfile from './components/Profile/UserProfile';
import IntegratedGenerator from './components/Creator/IntegratedGenerator';
import { CampaignDetails, CampaignsList } from './components/Campaign';
import CampaignCharacterEditor from './components/Campaign/CampaignCharacterEditor';
import PCList from './components/PC/PCList';
import { PCEditor } from './components/PC';
import PCCampaigns from './components/PC/PCCampaigns';
import { HomebrewManager } from './components/Homebrew';
import { DiceRoller } from './components/Dice/DiceRoller';
import RoomPage from './components/Room/RoomPage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DiceProvider>
        <BrowserRouter>
          <DiceRoller />
          <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/generator" element={<IntegratedGenerator />} />
            <Route path="/doc" element={<ComponentDoc />} />

            {/* Campaign Routes */}
            <Route path="/campaigns" element={<CampaignsList />} />
            <Route path="/campaigns/:id" element={<CampaignDetails />} />
            <Route path="/campaign-character-editor/:campaignId/:characterId" element={<CampaignCharacterEditor />} />

            {/* Character Routes */}
            <Route path="/characters" element={<PCList />} />
            <Route path="/pc-editor/:id" element={<PCEditor />} />
            <Route path="/pc/:id/campaigns" element={<PCCampaigns />} />

            {/* Homebrew Routes */}
            <Route path="/homebrew" element={<HomebrewManager />} />
            {/* Play Rooms MVP */}
            <Route path="/rooms/:id" element={<RoomPage />} />
          </Route>

          <Route path="*" element={
            <div className="flex flex-col items-center justify-center min-h-screen bg-indigo-900 text-white">
              <h1 className="text-4xl font-bold mb-4">404</h1>
              <p className="text-xl mb-8">Página não encontrada</p>
              <a href="/" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white">
                Voltar para o início
              </a>
            </div>
          } />
        </Routes>
        </BrowserRouter>
      </DiceProvider>
    </AuthProvider>
  );
};

export default App;

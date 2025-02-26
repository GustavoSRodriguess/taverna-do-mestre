import React from 'react';
import HomePage from './components/Home';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import IntegratedGenerator from './components/Creator/IntegratedGenerator';
import ComponentDoc from './components/ComponentDoc';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/generator' element={<IntegratedGenerator />} />
        <Route path='/doc' element={<ComponentDoc />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
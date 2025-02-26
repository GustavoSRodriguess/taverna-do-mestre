import React from 'react';
import HomePage from './components/Home';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { CharCreation } from './components/CharCreation';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/char-creation' element={<CharCreation />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
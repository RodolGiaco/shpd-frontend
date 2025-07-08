import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import App from "./App";
import CalibracionPage from "./pages/CalibracionPage";

const Protector: React.FC = () => {
  const location = useLocation();
  // Redirige todo a /calibracion preservando la query
  return (
    <Navigate to={`/calibracion${location.search}`} replace />
  );
};

const AppRouter: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/calibracion" element={<CalibracionPage />} />
      <Route path="/*" element={<Protector />} />
    </Routes>
  </BrowserRouter>
);

export default AppRouter; 
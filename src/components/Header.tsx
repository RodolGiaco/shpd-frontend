// src/components/Header.tsx
import React from "react";

interface Props {
  paciente: {
    nombre: string;
    edad: number;
    diagnostico: string;
  };
  tiempoActual: string;
  estadoSesion: string;
}

const Header: React.FC<Props> = ({ paciente, tiempoActual, estadoSesion }) => {
  return (
    <header className="w-full bg-white shadow p-4 flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold">🩺 Monitoreo Postural</h1>
        <p className="text-sm text-gray-600">Paciente: <strong>{paciente.nombre}</strong> ({paciente.edad} años) – {paciente.diagnostico}</p>
      </div>
      <div className="text-right">
        <p className="text-sm text-gray-500">🕒 {tiempoActual}</p>
        <p className="text-sm text-blue-600 font-medium">Estado: {estadoSesion}</p>
      </div>
    </header>
  );
};

export default Header;

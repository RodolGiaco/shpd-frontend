// src/App.tsx
import React, { useEffect, useState } from "react";
import {
  SessionData,
  SessionProgressData,
  HistorialPosturalItem,
} from "./types";
import PostureCard from "./components/PostureCard";
import SessionInfo from "./components/SessionInfo";
import HistoryChart from "./components/HistoryChart";
import Header from "./components/Header";
import SessionProgress from "./components/SessionProgress";
import PostureTimelineTable from "./components/PostureTimelineTable";

export default function App() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [progress, setProgress] = useState<SessionProgressData | null>(null);

  // Datos para la tabla de timeline
  const tablaResumen = [
    { timestamp: "00:01", postura: "sentado erguido", tiempo_mala_postura: 0 },
    { timestamp: "00:02", postura: "mentón en mano", tiempo_mala_postura: 15 },
    { timestamp: "00:03", postura: "slouching", tiempo_mala_postura: 45 },
    { timestamp: "00:04", postura: "inclinación hacia adelante", tiempo_mala_postura: 75 },
    { timestamp: "00:05", postura: "sentado erguido", tiempo_mala_postura: 0 },
  ];

  // Convertir tablaResumen para HistoryChart (HistorialPosturalItem[])
  const chartData: HistorialPosturalItem[] = tablaResumen.map(item => ({
    nombre: item.postura,
    conteo: item.tiempo_mala_postura,
  }));

  // 1) Obtener la sesión activa
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `http://${window.location.hostname}:8765/sesiones/`
        );
        const sessions: SessionData[] = await res.json();
        const last = sessions[sessions.length - 1];
        setSession({
          id: last.id,
          intervalo_segundos: last.intervalo_segundos,
          modo: last.modo,
          tiempo_transcurrido: 0,
        });
      } catch (err) {
        console.error("Error al obtener sesión:", err);
      }
    })();
  }, []);

  // 2) Polling de progreso desde Redis vía backend
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `http://${window.location.hostname}:8765/sesiones/progress/${session.id}`
        );
        const data: SessionProgressData = await res.json();
        setProgress(data);
      } catch (err) {
        console.error("Error al obtener progreso de sesión:", err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <Header
        tiempoActual={new Date().toLocaleString()}
        estadoSesion={session?.modo ?? "—"}
      />

      {session && progress ? (
        <>
          <div className="my-4">
            <SessionProgress
              actual={progress.elapsed}
              total={progress.intervalo_segundos}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-4">
              <PostureCard sesionId={session.id} />
              <HistoryChart sesionId={session.id} />
            </div>
            <div className="space-y-4">
              <SessionInfo
                session={{
                  ...session,
                  tiempo_transcurrido: progress.elapsed,
                }}
              />
              <PostureTimelineTable data={tablaResumen} />
            </div>
          </div>
        </>
      ) : (
        <p className="text-center p-4">Cargando configuración de sesión…</p>
      )}
    </main>
  );
}

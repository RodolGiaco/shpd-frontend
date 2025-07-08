// src/components/CalibracionMonitor.tsx
import React, { useEffect, useRef, useState } from "react";

interface Fase {
  nombre: "correcta" | "encorvada";
  color: string; // verde o rojo
}

interface Props {
  onFinish: () => void;
  autoStart?: boolean;
}

const CalibracionMonitor: React.FC<Props> = ({ onFinish, autoStart = true }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [calibrando, setCalibrando] = useState<boolean>(true);
  const faseColor = "#4caf50"; // solo usamos verde
  const faseLabel = "Mantén la espalda recta";
  const [enMarco, setEnMarco] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [finalizando, setFinalizando] = useState(false);

  // Obtener device_id de la URL
  const [deviceId] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get("device_id") || "demo";
  });

  // Tomamos session_id directamente de la URL
  const sessionId = new URLSearchParams(window.location.search).get("session_id");

  /* —— Video WebSocket —— */
  useEffect(() => {
    const host = window.location.hostname;
    const ws = new WebSocket(`ws://${host}:8765/video/output?device_id=${deviceId}`);
    ws.binaryType = "arraybuffer";
    ws.onmessage = (e) => {
      // Si es mensaje de control (modo calibracion)
      if (typeof e.data === "string") {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "modo" && msg.calibracion === true) {
            setCalibrando(true);
            setProgreso(0);
            setFinalizando(false);
            return;
          }
        } catch {}
      }
      // Si es frame JPEG
      const blob = new Blob([e.data], { type: "image/jpeg" });
      const img = new Image();
      img.src = URL.createObjectURL(blob);
      img.onload = () => {
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx && canvasRef.current) {
          ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
        }
        URL.revokeObjectURL(img.src);
      };
    };
    return () => ws.close();
  }, [deviceId]);

  /* —— Polling al backend con tiempos —— */
  useEffect(() => {
    if (!calibrando || !sessionId) return;
    const interval = setInterval(async () => {
      try {
        const url = `http://${window.location.hostname}:8765/calib/progress/${sessionId}`;
        const { good_time, correcta } = await fetch(url).then(r => r.json());

        // postura coincide con fase
        if (!correcta) {
          setEnMarco(false);
          setProgreso(0);
          return;
        }

        // Calcula progreso basado en good_time (0–10 s)
        const pct = Math.min(100, (good_time / 10) * 100);
        setProgreso(pct);
        setEnMarco(pct > 0); // sólo mostramos anillo cuando hay avance

        if (pct >= 100) {
          setFinalizando(true);
          setCalibrando(false);
        }
      } catch {/* ignora */}
    }, 800);
    return () => clearInterval(interval);
  }, [calibrando, sessionId]);

  if (!calibrando && !finalizando) {
    // calibración ya terminó y mensaje final se cerró
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <h1 className="text-2xl font-semibold mb-6 text-blue-700">
        Calibración de dispositivo
      </h1>

      {/* Marco */}
      <div className="relative w-[28rem] h-[28rem] flex items-center justify-center">
        <div
          className={`absolute inset-0 border-4 rounded-xl transition-colors duration-300 ${
            enMarco ? "border-green-400" : "border-blue-300"
          }`}
        />
        <canvas ref={canvasRef} width={420} height={420} className="rounded object-cover" />

        {/* Anillo de progreso */}
        {progreso > 0 && progreso < 100 && (
          <svg className="absolute w-full h-full">
            <circle
              cx="50%"
              cy="50%"
              r="46%"
              stroke={faseColor}
              strokeWidth="6"
              fill="none"
              strokeDasharray="314"
              strokeDashoffset={314 - (314 * progreso) / 100}
              className="transition-[stroke-dashoffset] duration-100"
            />
          </svg>
        )}
      </div>

      {/* Mensajes */}
      {!enMarco && (
        <p className="mt-4 text-gray-600 text-center max-w-xs">
          {faseLabel}
        </p>
      )}
      {progreso > 0 && progreso < 100 && (
        <p className="mt-4 text-blue-600">Calibrando… {Math.floor(progreso)}%</p>
      )}
      {progreso >= 100 && finalizando && (
        <div className="flex flex-col items-center mt-4 text-green-600">
          <span className="text-3xl mb-2">✅</span>
          <p className="font-medium text-center">
            Dispositivo calibrado correctamente.
            <br />Presiona "Iniciar sesión" para comenzar el monitoreo.
          </p>
          <button
            onClick={() => {
              // localStorage.setItem("calibrado", "1");
              window.location.replace("/" + window.location.search);
            }}
            className="mt-4 px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full shadow-lg hover:scale-105 transition-all duration-300 text-lg font-semibold focus:outline-none focus:ring-4 focus:ring-green-200"
          >
            🏁 Iniciar sesión
          </button>
        </div>
      )}
    </div>
  );
};

export default CalibracionMonitor;
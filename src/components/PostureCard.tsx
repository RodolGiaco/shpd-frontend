// src/components/PostureCard.tsx
import React, { useEffect, useRef, useState } from "react";
import { PosturaData } from "../types";
import { PieChart, Pie, Cell } from "recharts";

interface Props {
  sesionId: string;
}

const PostureCard: React.FC<Props> = ({ sesionId }) => {
  const [postura, setPostura] = useState<PosturaData | null>(null);
  const [animar, setAnimar] = useState(false);
  const [prevPostura, setPrevPostura] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Polling de métricas cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`http://${window.location.hostname}:8765/metricas/${sesionId}`)
        .then(res => res.json())
        .then(data => setPostura(data))
        .catch(console.error);
    }, 1000);

    return () => clearInterval(interval);
  }, [sesionId]);

  // Animación al cambiar postura.actual
  useEffect(() => {
    if (postura && postura.actual !== prevPostura) {
      setAnimar(true);
      setPrevPostura(postura.actual);
      const timeout = setTimeout(() => setAnimar(false), 1200);
      return () => clearTimeout(timeout);
    }
  }, [postura, prevPostura]);

  // WebSocket para streaming de video
  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.hostname}:8765/video/output`);
    ws.binaryType = "arraybuffer";

    ws.onmessage = event => {
      const blob = new Blob([event.data], { type: "image/jpeg" });
      const img = new Image();
      img.src = URL.createObjectURL(blob);
      img.onload = () => {
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx && canvasRef.current) {
          ctx.drawImage(
            img,
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );
        }
        URL.revokeObjectURL(img.src);
      };
    };

    return () => ws.close();
  }, []);

  const pieData = postura
    ? [
        { name: "Correcta", value: postura.porcentaje_correcta },
        { name: "Incorrecta", value: postura.porcentaje_incorrecta },
      ]
    : [];

  const getColor = (inc: number) =>
    inc > 70 ? "text-red-600" : inc > 40 ? "text-yellow-600" : "text-green-600";

  const getCardRing = (inc: number) =>
    inc > 70 ? "ring-red-300" : inc > 40 ? "ring-yellow-300" : "ring-green-300";

  const riesgo = (inc: number) =>
    inc > 70
      ? "📉 Riesgo alto de fatiga postural"
      : inc > 40
      ? "⚠️ Riesgo moderado"
      : "✅ Riesgo bajo";

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Métricas / PostureCard */}
      <div
        className={`p-4 bg-blue-50 border border-blue-200 rounded-lg shadow space-y-4 transition-all duration-500 ring-2 ${
          postura ? getCardRing(postura.porcentaje_incorrecta) : "ring-gray-300"
        }`}
      >
        {/* Contenedor alineado a la izquierda */}
        {!postura ? (
          <p className="p-4 text-gray-500">Cargando métricas…</p>
        ) : (
          <>
            <div className="flex flex-col items-start text-left space-y-1">
              <h2 className="text-2xl font-extrabold flex items-center gap-2">
                <span role="img" aria-label="postura">🧍‍♂️</span>
                Postura Actual
              </h2>
              <p
                className={`text-xl font-bold text-blue-700 transition-all duration-500 break-words ${
                  animar ? "scale-105 animate-pulse" : ""
                }`}
              >
                {postura.actual.replace(/_/g, " ")}
              </p>
            </div>

            <p className="text-gray-700">
              Transiciones a mala postura: <strong>{postura.transiciones_malas}</strong>
            </p>

            <div className="flex flex-col items-start gap-2 max-w-[320px]">
              <div className="flex items-center gap-2">
                <PieChart width={100} height={100}>
                  <Pie
                    data={pieData}
                    cx={50}
                    cy={50}
                    innerRadius={25}
                    outerRadius={40}
                    dataKey="value"
                  >
                    <Cell fill="#22c55e" />
                    <Cell fill="#f43f5e" />
                  </Pie>
                </PieChart>
                <div>
                  <p className="text-green-600">
                    ✅ Correcta: {postura.porcentaje_correcta.toFixed(1)}%
                  </p>
                  <p className={getColor(postura.porcentaje_incorrecta)}>
                    ❌ Incorrecta: {postura.porcentaje_incorrecta.toFixed(1)}%
                  </p>
                </div>
              </div>
              <p className={`text-sm ${getColor(postura.porcentaje_incorrecta)}`}>
                {riesgo(postura.porcentaje_incorrecta)}
              </p>
            </div>

            <hr className="my-2 border-gray-300" />

            <div className="text-gray-800 space-y-1">
              <p>
                🪑 Sentado: {postura.tiempo_sentado}s / 🧍 Parado: {postura.tiempo_parado}s
              </p>
              <p className="text-rose-600">
                🚨 Alertas: {postura.alertas_enviadas}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Streaming de video – siempre visible */}
      <div className="w-full bg-black rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          className="w-full h-auto"
        />
      </div>
    </div>
  );
};

export default PostureCard;

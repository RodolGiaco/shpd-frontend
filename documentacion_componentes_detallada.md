# Análisis Detallado de Componentes del Sistema Frontend

## Índice

1. [Componente AppRouter - Análisis Línea por Línea](#componente-approuter---análisis-línea-por-línea)
2. [Componente App - Análisis Detallado](#componente-app---análisis-detallado)
3. [Componente CalibracionMonitor - Análisis Completo](#componente-calibracionmonitor---análisis-completo)
4. [Componente PostureCard - Desglose Funcional](#componente-posturecard---desglose-funcional)
5. [Integración de WebSockets](#integración-de-websockets)

---

## 1. Componente AppRouter - Análisis Línea por Línea

### Archivo: `src/AppRouter.tsx`

```typescript
import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import App from "./App";
import CalibracionPage from "./pages/CalibracionPage";
```

**Líneas 1-4**: Importaciones necesarias
- `React`: Biblioteca principal para construcción de interfaces
- `BrowserRouter`: Componente que proporciona contexto de enrutamiento usando la History API del navegador
- `Routes, Route`: Componentes para definir rutas y sus correspondientes componentes
- `Navigate`: Componente para redirección programática
- `useLocation`: Hook para acceder a la ubicación actual (URL, query params)

```typescript
const Decision: React.FC = () => {
  const location = useLocation();
```

**Líneas 6-7**: Definición del componente Decision
- `React.FC`: Tipo TypeScript para Function Component
- `useLocation()`: Obtiene objeto location con pathname, search, hash, state

```typescript
  const params = new URLSearchParams(location.search);
```

**Línea 8**: Parseo de query parameters
- `URLSearchParams`: API nativa del navegador para manejar parámetros de URL
- `location.search`: String con los parámetros (ej: "?forceCalib=1&device_id=123")

```typescript
  const force = params.get("forceCalib") === "1";
```

**Línea 9**: Verificación de calibración forzada
- `params.get()`: Obtiene valor del parámetro o null si no existe
- Compara estrictamente con "1" para determinar si se debe forzar calibración

```typescript
  const calibrado = !force && localStorage.getItem("calibrado") === "1";
```

**Línea 10**: Lógica de estado de calibración
- Si `force` es true, `calibrado` será false (forzar recalibración)
- Si `force` es false, verifica en localStorage si ya se calibró
- Usa operador AND (&&) para evaluación condicional

```typescript
  if (calibrado) {
    return <App />; // interfaz normal
  }
```

**Líneas 12-14**: Renderizado condicional
- Si está calibrado, renderiza el componente principal App
- Este es el flujo normal cuando el usuario ya pasó por calibración

```typescript
  return <Navigate to={`/calibracion${location.search}`} replace />;
```

**Línea 17**: Redirección a calibración
- Usa template literal para preservar query params originales
- `replace`: Reemplaza la entrada actual en el historial (no permite volver atrás)

```typescript
const AppRouter: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/calibracion" element={<CalibracionPage />} />
      <Route path="/*" element={<Decision />} />
    </Routes>
  </BrowserRouter>
);
```

**Líneas 20-27**: Componente principal de enrutamiento
- `BrowserRouter`: Envuelve toda la aplicación con contexto de enrutamiento
- `Routes`: Contenedor para todas las rutas
- Primera ruta: `/calibracion` renderiza directamente CalibracionPage
- Segunda ruta: `/*` (cualquier otra ruta) pasa por Decision para validación

---

## 2. Componente App - Análisis Detallado

### Estados y su Propósito

```typescript
const [session, setSession] = useState<SessionData | null>(null);
```
**Estado session**: 
- Almacena información de la sesión activa
- Tipo `SessionData` incluye: id, intervalo_segundos, tiempo_transcurrido, modo
- Inicializado como null hasta que se obtiene del backend

```typescript
const [progress, setProgress] = useState<SessionProgressData | null>(null);
```
**Estado progress**:
- Rastrea el progreso actual de la sesión
- Se actualiza cada segundo mediante polling
- Contiene elapsed (tiempo transcurrido) e intervalo_segundos

```typescript
const [paciente, setPaciente] = useState<Paciente | null>(null);
```
**Estado paciente**:
- Información del paciente actual
- Incluye: nombre, edad, diagnóstico, telegram_id
- Se obtiene usando el device_id de la URL

```typescript
const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
```
**Estado timeline**:
- Array de entradas temporales de posturas
- Cada entrada tiene: timestamp, postura, tiempo_mala_postura
- Se actualiza cada 3 segundos

### useEffect: Obtención de device_id

```typescript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("device_id");
  if (id) {
    setDeviceId(id);
  } else {
    console.error("No se encontró 'device_id' en la URL.");
  }
}, []);
```

**Análisis línea por línea**:
1. `useEffect` con array vacío `[]` se ejecuta solo al montar el componente
2. Crea instancia de URLSearchParams con los parámetros de la URL actual
3. Extrae el parámetro "device_id"
4. Si existe, actualiza el estado deviceId
5. Si no existe, registra error en consola (caso no esperado en producción)

### useEffect: Polling de Timeline

```typescript
useEffect(() => {
  if (!session) return;

  const fetchTimeline = async () => {
    try {
      const res = await fetch(
        `http://${window.location.hostname}:8765/timeline/${session.id}`
      );
      const data: TimelineEntry[] = await res.json();
      setTimeline(data);
    } catch (err) {
      console.error("Error al obtener timeline:", err);
    }
  };

  fetchTimeline();
  const idInt = setInterval(fetchTimeline, 3000);
  return () => clearInterval(idInt);
}, [session]);
```

**Desglose del funcionamiento**:
1. **Guard clause**: Si no hay sesión, no hace nada
2. **Función async fetchTimeline**:
   - Construye URL dinámica usando hostname actual y session.id
   - Hace petición GET al endpoint /timeline/{session_id}
   - Parsea respuesta JSON con tipo TimelineEntry[]
   - Actualiza estado timeline
   - Maneja errores sin interrumpir la aplicación
3. **Ejecución inmediata**: Llama fetchTimeline() sin esperar
4. **Polling**: Establece intervalo de 3 segundos
5. **Cleanup**: Retorna función que limpia el intervalo al desmontar

### useEffect: Control de Fin de Sesión

```typescript
useEffect(() => {
  if (sessionEnded && deviceId) {
    if (localStorage.getItem(`session_ended_${deviceId}`) === "true") return;

    fetch(`http://${window.location.hostname}:8765/sesiones/end/${deviceId}`, {
      method: "POST",
    })
      .then(res => res.json())
      .then(data => {
        localStorage.setItem(`session_ended_${deviceId}`, "true");
        localStorage.removeItem("calibrado");
        console.log("Sesión finalizada y reporte enviado:", data);
      })
      .catch(err => {
        console.error("Error al finalizar sesión:", err);
      });
  }
}, [sessionEnded, deviceId]);
```

**Lógica de prevención de duplicados**:
1. Solo ejecuta si `sessionEnded` es true Y existe `deviceId`
2. Verifica en localStorage si ya se procesó esta finalización
3. Si ya se procesó, termina inmediatamente (evita duplicados)
4. Hace POST al backend para notificar fin de sesión
5. Marca en localStorage que se procesó (clave única por device)
6. Elimina estado de calibración para forzar recalibración en próxima sesión

### Renderizado Condicional de Fin de Sesión

```typescript
if (sessionEnded) {
  const handleRestartSession = () => {
    if (!deviceId) return;
    
    localStorage.removeItem(`session_ended_${deviceId}`);
    
    fetch(`http://${window.location.hostname}:8765/sesiones/reiniciar/${session?.id ?? ""}?device_id=${deviceId}`,
      { method: "POST" }
    ).catch(() => {});

    window.location.href = `/calibracion?device_id=${deviceId}`;
  };
```

**Manejo de reinicio**:
1. Define función local handleRestartSession
2. Valida existencia de deviceId
3. Limpia marca de sesión finalizada en localStorage
4. Llama endpoint de reinicio (fire-and-forget, no bloquea UI)
5. Redirige inmediatamente a calibración preservando device_id

---

## 3. Componente CalibracionMonitor - Análisis Completo

### WebSocket para Streaming de Video

```typescript
useEffect(() => {
  const host = window.location.hostname;
  const ws = new WebSocket(`ws://${host}:8765/video/output?device_id=${deviceId}`);
  ws.binaryType = "arraybuffer";
```

**Configuración inicial**:
- Extrae hostname dinámicamente (funciona en cualquier entorno)
- Construye URL WebSocket con protocolo ws://
- Configura binaryType como arraybuffer para recibir datos binarios

```typescript
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
```

**Manejo de mensajes de control**:
1. Detecta si el mensaje es string (JSON) o binario
2. Si es string, intenta parsearlo como JSON
3. Verifica estructura específica: type="modo" y calibracion=true
4. Reinicia estado de calibración si se recibe comando
5. Catch vacío para ignorar mensajes mal formados

```typescript
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
```

**Procesamiento de frames de video**:
1. Crea Blob desde ArrayBuffer con tipo MIME image/jpeg
2. Crea elemento Image en memoria
3. Genera URL temporal para el blob
4. En el evento onload:
   - Obtiene contexto 2D del canvas (con optional chaining)
   - Dibuja imagen escalada al tamaño del canvas
   - **IMPORTANTE**: Libera memoria con revokeObjectURL

### Lógica de Progreso de Calibración

```typescript
useEffect(() => {
  if (!calibrando || !sessionId) return;
  
  const interval = setInterval(async () => {
    try {
      const url = `http://${window.location.hostname}:8765/calib/progress/${sessionId}`;
      const { good_time, correcta } = await fetch(url).then(r => r.json());
```

**Polling de estado**:
- Solo ejecuta si está calibrando Y existe sessionId
- Intervalo de 800ms (más frecuente que otros pollings)
- Desestructura respuesta esperando good_time y correcta

```typescript
      if (!correcta) {
        setEnMarco(false);
        setProgreso(0);
        return;
      }
```

**Reset cuando postura incorrecta**:
- Si postura no es correcta, reinicia todo el progreso
- Oculta indicador visual (enMarco = false)
- Usuario debe volver a mantener postura correcta

```typescript
      const pct = Math.min(100, (good_time / 10) * 100);
      setProgreso(pct);
      setEnMarco(pct > 0);
      
      if (pct >= 100) {
        setFinalizando(true);
        setCalibrando(false);
      }
```

**Cálculo de progreso**:
- Convierte segundos (0-10) a porcentaje (0-100)
- Math.min previene valores superiores a 100%
- Marco visible solo cuando hay progreso (pct > 0)
- Al llegar a 100%, inicia secuencia de finalización

### Renderizado del Anillo de Progreso SVG

```typescript
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
```

**Técnica de animación SVG**:
- Solo visible durante progreso activo (0 < progreso < 100)
- Posicionamiento absoluto sobre el video
- Centro en 50% para responsividad
- Radio 46% deja margen visual
- **strokeDasharray="314"**: Circunferencia aproximada (2πr)
- **strokeDashoffset**: Controla qué porción del círculo es visible
- Transición CSS suaviza cambios

---

## 4. Componente PostureCard - Desglose Funcional

### Obtención de Postura con Mayor Porcentaje

```typescript
const getHighestPosture = (
  analysis: AnalysisResponse
): { label: string; value: number } | null => {
  const entries = Object.entries(analysis);
  if (entries.length === 0) return null;

  let maxLabel = entries[0][0];
  let maxValue = entries[0][1];
  for (const [label, value] of entries) {
    if (value > maxValue) {
      maxValue = value;
      maxLabel = label;
    }
  }
  return { label: maxLabel, value: maxValue };
};
```

**Algoritmo de búsqueda**:
1. Convierte objeto a array de tuplas [clave, valor]
2. Maneja caso vacío retornando null
3. Inicializa con primer elemento como máximo
4. Itera usando desestructuración de arrays
5. Actualiza máximo cuando encuentra valor mayor
6. Retorna objeto con label y value del máximo

### Animación de Cambio de Postura

```typescript
useEffect(() => {
  if (analysis) {
    const highest = getHighestPosture(analysis);
    if (highest && highest.label !== prevHighestLabel) {
      setAnimar(true);
      setPrevHighestLabel(highest.label);
      const timeout = setTimeout(() => setAnimar(false), 1200);
      return () => clearTimeout(timeout);
    }
  }
}, [analysis, prevHighestLabel]);
```

**Control de animación**:
1. Ejecuta cuando cambia analysis o prevHighestLabel
2. Obtiene postura dominante actual
3. Compara con etiqueta previa para detectar cambios
4. Si cambió:
   - Activa bandera de animación
   - Guarda nueva etiqueta como previa
   - Programa desactivación tras 1.2 segundos
   - Limpia timeout si el componente se desmonta

### Cálculo Visual de Riesgo

```typescript
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
```

**Sistema de umbrales**:
- **0-40%**: Verde - Riesgo bajo
- **40-70%**: Amarillo - Riesgo moderado  
- **70-100%**: Rojo - Riesgo alto
- Funciones puras que retornan clases CSS o mensajes
- Usa operadores ternarios anidados para brevedad

### Renderizado Condicional con Estados de Carga

```typescript
{!postura || !postura.actual ? (
  <div className="flex flex-col items-center justify-center text-center w-full h-full bg-blue-100 border border-blue-200 rounded-md">
    <span className="text-4xl mb-2">📷</span>
    <h2 className="text-lg font-semibold text-blue-800">Esperando detectar a una persona…</h2>
    <p className="text-sm text-blue-600 mt-1">Colócate dentro del encuadre.</p>
  </div>
) : (
  // Contenido principal cuando hay datos
)}
```

**Estados de UI**:
1. **Sin datos**: Muestra placeholder amigable
2. **Con datos**: Renderiza métricas completas
3. Verifica tanto existencia de postura como campo actual
4. Diseño centrado con flexbox para mejor UX

---

## 5. Integración de WebSockets

### Patrón de Reconexión (Mejora Sugerida)

```typescript
class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectInterval: number = 5000;
  private maxReconnectAttempts: number = 5;
  private reconnectAttempts: number = 0;

  constructor(url: string) {
    this.url = url;
    this.connect();
  }

  private connect() {
    try {
      this.ws = new WebSocket(this.url);
      this.setupEventHandlers();
    } catch (error) {
      console.error("WebSocket connection error:", error);
      this.scheduleReconnect();
    }
  }

  private setupEventHandlers() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log("WebSocket connected");
      this.reconnectAttempts = 0;
    };

    this.ws.onclose = () => {
      console.log("WebSocket disconnected");
      this.scheduleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      return;
    }

    setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`Reconnection attempt ${this.reconnectAttempts}`);
      this.connect();
    }, this.reconnectInterval);
  }

  public send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    } else {
      console.warn("WebSocket not ready, queuing message");
    }
  }

  public close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
```

**Características del patrón**:
1. **Encapsulación**: Toda la lógica WebSocket en una clase
2. **Reconexión automática**: Con límite de intentos
3. **Manejo de estados**: Verifica readyState antes de enviar
4. **Logging**: Para debugging en producción
5. **Cleanup**: Método close() para limpieza

### Optimización de Memoria en Streaming

```typescript
const VideoStreamComponent: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(new Image());
  
  useEffect(() => {
    const img = imageRef.current;
    
    // Reutilizar la misma instancia de Image
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext("2d", { 
        alpha: false,  // No necesitamos canal alpha
        desynchronized: true  // Mejor rendimiento
      });
      
      if (ctx) {
        ctx.imageSmoothingEnabled = false;  // Menos procesamiento
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
      
      // Liberar blob URL inmediatamente
      URL.revokeObjectURL(img.src);
    };
    
    return () => {
      // Cleanup
      img.onload = null;
    };
  }, []);
```

**Optimizaciones aplicadas**:
1. **Reutilización de objetos**: Una sola instancia de Image
2. **Canvas sin alpha**: Reduce memoria y procesamiento
3. **desynchronized**: Permite renderizado asíncrono
4. **imageSmoothingEnabled=false**: Evita antialiasing innecesario
5. **Liberación inmediata**: revokeObjectURL tras cada frame

### Manejo de Errores en WebSocket

```typescript
const useWebSocket = (url: string) => {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [lastError, setLastError] = useState<string | null>(null);
  
  useEffect(() => {
    let ws: WebSocket;
    
    try {
      ws = new WebSocket(url);
      
      ws.onopen = () => {
        setConnectionStatus('connected');
        setLastError(null);
      };
      
      ws.onerror = (event) => {
        setConnectionStatus('error');
        setLastError('Error de conexión WebSocket');
        console.error('WebSocket error:', event);
      };
      
      ws.onclose = (event) => {
        setConnectionStatus('disconnected');
        
        if (event.code === 1006) {
          setLastError('Conexión perdida inesperadamente');
        } else if (event.code === 1000) {
          setLastError('Conexión cerrada normalmente');
        } else {
          setLastError(`Conexión cerrada con código: ${event.code}`);
        }
      };
      
    } catch (error) {
      setConnectionStatus('error');
      setLastError(error instanceof Error ? error.message : 'Error desconocido');
    }
    
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'Component unmounting');
      }
    };
  }, [url]);
  
  return { connectionStatus, lastError };
};
```

**Manejo robusto de errores**:
1. **Estados de conexión**: Tracking detallado del estado
2. **Códigos de cierre**: Interpretación de códigos WebSocket
3. **Mensajes de error**: Legibles para el usuario
4. **Cleanup controlado**: Cierre con código y razón
5. **Type safety**: Estados bien tipados

---

## Conclusión del Análisis Detallado

Este análisis línea por línea revela varios patrones y mejores prácticas implementadas en el frontend:

1. **Gestión de Estado Reactiva**: Uso efectivo de hooks de React para manejar estado complejo
2. **Comunicación en Tiempo Real**: Implementación robusta de WebSockets y polling
3. **Optimización de Rendimiento**: Gestión cuidadosa de memoria y recursos
4. **Manejo de Errores**: Estrategias defensivas en toda la aplicación
5. **UX Considerada**: Estados de carga, animaciones y feedback visual

Las áreas de mejora identificadas incluyen la implementación de reconexión automática de WebSocket y una gestión de estado más centralizada, que podrían elevar aún más la calidad y confiabilidad del sistema.
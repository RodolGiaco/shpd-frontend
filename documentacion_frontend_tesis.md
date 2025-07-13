# Documentación del Sistema Frontend de Detección de Posturas

## Índice de Contenidos

1. [Introducción](#introducción)
2. [Arquitectura del Frontend](#arquitectura-del-frontend)
3. [Tecnologías y Dependencias](#tecnologías-y-dependencias)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Componentes Principales](#componentes-principales)
6. [Flujo de Datos y Comunicación](#flujo-de-datos-y-comunicación)
7. [Proceso de Calibración](#proceso-de-calibración)
8. [Visualización de Datos en Tiempo Real](#visualización-de-datos-en-tiempo-real)
9. [Gestión de Sesiones](#gestión-de-sesiones)
10. [Despliegue y Producción](#despliegue-y-producción)
11. [Conclusiones y Mejoras Futuras](#conclusiones-y-mejoras-futuras)

---

## 1. Introducción

El presente documento detalla la implementación del módulo frontend del sistema de detección y monitoreo de posturas corporales desarrollado como parte de esta tesis de ingeniería. Este sistema tiene como objetivo principal proporcionar una interfaz de usuario intuitiva y responsiva para el monitoreo en tiempo real de la postura corporal de pacientes, facilitando la prevención de problemas ergonómicos y musculoesqueléticos.

### 1.1 Objetivos del Frontend

El módulo frontend cumple con los siguientes objetivos específicos:

1. **Visualización en Tiempo Real**: Presentar información actualizada sobre la postura del usuario mediante streaming de video y métricas procesadas.
2. **Calibración del Sistema**: Guiar al usuario a través del proceso inicial de calibración para garantizar mediciones precisas.
3. **Análisis Estadístico**: Mostrar estadísticas y gráficos históricos sobre las posturas detectadas durante las sesiones.
4. **Gestión de Sesiones**: Controlar el inicio, progreso y finalización de sesiones de monitoreo.
5. **Interfaz Adaptativa**: Proporcionar una experiencia de usuario consistente en diferentes dispositivos y tamaños de pantalla.

### 1.2 Alcance del Documento

Esta documentación abarca:
- La arquitectura técnica del frontend y sus componentes
- Los flujos de datos entre el frontend y el backend
- La implementación detallada de cada módulo funcional
- Las decisiones de diseño y patrones arquitectónicos empleados
- El proceso de despliegue y configuración en producción

---

## 2. Arquitectura del Frontend

### 2.1 Visión General

El frontend está construido como una Single Page Application (SPA) utilizando React 19.1.0 con TypeScript, siguiendo una arquitectura basada en componentes que promueve la reutilización de código y la separación de responsabilidades.

### 2.2 Patrón Arquitectónico

Se implementa un patrón de arquitectura en capas:

```
┌─────────────────────────────────────────┐
│         Capa de Presentación            │
│    (Componentes React + Tailwind CSS)   │
├─────────────────────────────────────────┤
│         Capa de Lógica de Negocio       │
│    (Hooks personalizados, Estado)       │
├─────────────────────────────────────────┤
│        Capa de Comunicación             │
│    (WebSockets, Fetch API, Polling)     │
└─────────────────────────────────────────┘
```

### 2.3 Flujo de Datos Unidireccional

El sistema sigue el principio de flujo de datos unidireccional de React:
1. Los datos fluyen desde el estado hacia los componentes
2. Las acciones del usuario generan actualizaciones de estado
3. Los cambios de estado provocan re-renderizados de componentes

---

## 3. Tecnologías y Dependencias

### 3.1 Stack Tecnológico Principal

```json
{
  "react": "^19.1.0",          // Framework UI principal
  "typescript": "^4.9.5",       // Tipado estático
  "react-router-dom": "^6.23.0", // Enrutamiento SPA
  "tailwindcss": "^3.4.17",    // Framework CSS utility-first
  "recharts": "^2.15.3"         // Librería de gráficos
}
```

### 3.2 Herramientas de Desarrollo

- **React Scripts 5.0.1**: Configuración preestablecida de webpack, babel y herramientas de desarrollo
- **PostCSS y Autoprefixer**: Procesamiento de CSS para compatibilidad cross-browser
- **Testing Library**: Suite de pruebas para componentes React

### 3.3 Justificación de las Tecnologías

1. **React**: Elegido por su ecosistema maduro, rendimiento optimizado mediante Virtual DOM y amplia documentación
2. **TypeScript**: Proporciona tipado estático que reduce errores en tiempo de desarrollo
3. **Tailwind CSS**: Permite desarrollo rápido de interfaces con clases utilitarias predefinidas
4. **Recharts**: Librería declarativa para gráficos, compatible con el paradigma de React

---

## 4. Estructura del Proyecto

### 4.1 Organización de Directorios

```
frontend/
├── public/                  # Archivos estáticos públicos
├── src/                    # Código fuente principal
│   ├── components/         # Componentes reutilizables
│   │   ├── CalibracionMonitor.tsx
│   │   ├── Header.tsx
│   │   ├── HistoryChart.tsx
│   │   ├── PostureCard.tsx
│   │   ├── PostureTimelineTable.tsx
│   │   ├── SessionInfo.tsx
│   │   ├── SessionProgress.tsx
│   │   ├── TimelineChart.tsx
│   │   └── VideoPanel.tsx
│   ├── pages/             # Componentes de página
│   │   └── CalibracionPage.tsx
│   ├── App.tsx            # Componente principal
│   ├── AppRouter.tsx      # Configuración de rutas
│   ├── types.ts           # Definiciones TypeScript
│   └── index.tsx          # Punto de entrada
├── nginx.conf             # Configuración del servidor
├── Dockerfile             # Containerización
└── package.json           # Dependencias y scripts
```

### 4.2 Convenciones de Código

- **Nomenclatura de Componentes**: PascalCase para componentes React
- **Nomenclatura de Archivos**: Coincide con el nombre del componente exportado
- **Organización de Imports**: Agrupados por origen (React, librerías externas, componentes locales)

---

## 5. Componentes Principales

### 5.1 AppRouter - Enrutamiento Principal

El componente `AppRouter` implementa la lógica de navegación y control de acceso:

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

#### Componente Decision

Implementa la lógica de redirección basada en el estado de calibración:

```typescript
const Decision: React.FC = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const force = params.get("forceCalib") === "1";
  const calibrado = !force && localStorage.getItem("calibrado") === "1";

  if (calibrado) {
    return <App />; // Interfaz principal
  }
  return <Navigate to={`/calibracion${location.search}`} replace />;
};
```

**Explicación del flujo**:
1. Verifica si existe el parámetro `forceCalib` para forzar calibración
2. Consulta el estado de calibración en localStorage
3. Redirige según el estado actual del sistema

### 5.2 App - Componente Principal

El componente `App` actúa como contenedor principal y gestor del estado global de la aplicación.

#### Estados Principales

```typescript
const [session, setSession] = useState<SessionData | null>(null);
const [progress, setProgress] = useState<SessionProgressData | null>(null);
const [paciente, setPaciente] = useState<Paciente | null>(null);
const [deviceId, setDeviceId] = useState<string | null>(null);
const [sessionEnded, setSessionEnded] = useState(false);
const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
```

#### Ciclo de Vida y Efectos

1. **Obtención del device_id**:
```typescript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("device_id");
  if (id) {
    setDeviceId(id);
  }
}, []);
```

2. **Carga de datos del paciente**:
```typescript
useEffect(() => {
  if (!deviceId) return;
  
  (async () => {
    const res = await fetch(`http://${window.location.hostname}:8765/pacientes/${deviceId}`);
    const data: Paciente = await res.json();
    setPaciente(data);
  })();
}, [deviceId]);
```

3. **Polling del progreso de sesión**:
```typescript
useEffect(() => {
  if (!session) return;
  
  const interval = setInterval(async () => {
    const res = await fetch(
      `http://${window.location.hostname}:8765/sesiones/progress/${session.id}`
    );
    const data: SessionProgressData = await res.json();
    setProgress(data);
    
    if (data && data.elapsed >= data.intervalo_segundos) {
      setSessionEnded(true);
    }
  }, 1000);
  
  return () => clearInterval(interval);
}, [session, deviceId]);
```

### 5.3 CalibracionMonitor - Sistema de Calibración

Este componente implementa el proceso crítico de calibración inicial del sistema.

#### Funcionalidades Principales

1. **Streaming de Video WebSocket**:
```typescript
useEffect(() => {
  const ws = new WebSocket(`ws://${host}:8765/video/output?device_id=${deviceId}`);
  ws.binaryType = "arraybuffer";
  
  ws.onmessage = (e) => {
    if (typeof e.data === "string") {
      // Manejo de mensajes de control
      const msg = JSON.parse(e.data);
      if (msg.type === "modo" && msg.calibracion === true) {
        setCalibrando(true);
      }
    } else {
      // Renderizado de frames JPEG
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
    }
  };
}, [deviceId]);
```

2. **Monitoreo del Progreso de Calibración**:
```typescript
useEffect(() => {
  if (!calibrando || !sessionId) return;
  
  const interval = setInterval(async () => {
    const { good_time, correcta } = await fetch(url).then(r => r.json());
    
    if (!correcta) {
      setEnMarco(false);
      setProgreso(0);
      return;
    }
    
    const pct = Math.min(100, (good_time / 10) * 100);
    setProgreso(pct);
    setEnMarco(pct > 0);
    
    if (pct >= 100) {
      setFinalizando(true);
      setCalibrando(false);
    }
  }, 800);
}, [calibrando, sessionId]);
```

#### Interfaz Visual de Calibración

El componente presenta:
- Canvas para streaming de video en tiempo real
- Marco visual que cambia de color según el estado
- Anillo de progreso SVG animado
- Mensajes de retroalimentación al usuario

### 5.4 PostureCard - Visualización de Postura

Este componente es el núcleo de la visualización de datos posturales en tiempo real.

#### Estructura de Datos

```typescript
interface PosturaData {
  actual: string;
  transiciones_malas: number;
  porcentaje_correcta: number;
  porcentaje_incorrecta: number;
  tiempo_parado: number;
  tiempo_sentado: number;
  alertas_enviadas: number;
}
```

#### Polling de Métricas

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    fetch(`http://${window.location.hostname}:8765/metricas/${sesionId}`)
      .then((res) => res.json())
      .then((data) => setPostura(data))
      .catch(console.error);
  }, 1000);
  
  return () => clearInterval(interval);
}, [sesionId]);
```

#### Visualización de Datos

1. **Gráfico Circular (Pie Chart)**:
   - Muestra proporción de postura correcta vs incorrecta
   - Actualización en tiempo real
   - Colores semáforos (verde/rojo)

2. **Indicadores de Riesgo**:
```typescript
const riesgo = (inc: number) =>
  inc > 70
    ? "📉 Riesgo alto de fatiga postural"
    : inc > 40
    ? "⚠️ Riesgo moderado"
    : "✅ Riesgo bajo";
```

3. **Streaming de Video**:
   - Canvas HTML5 para renderizado
   - WebSocket para transmisión de frames JPEG
   - Gestión eficiente de memoria con `URL.revokeObjectURL`

### 5.5 HistoryChart - Historial de Posturas

Implementa visualización estadística mediante gráficos de barras.

#### Configuración de Posturas Fijas

```typescript
const POSTURAS_FIJAS = [
  "Sentado erguido",
  "Inclinación hacia adelante",
  "Inclinación hacia atrás",
  // ... 13 posturas en total
];
```

#### Procesamiento de Datos

```typescript
const data = POSTURAS_FIJAS.map((postura) => {
  const found = historial.find(
    (item) => item.nombre === postura
  );
  
  return {
    postura,
    conteo: found ? found.conteo : 0,
  };
});
```

**Características**:
- Garantiza visualización de todas las posturas predefinidas
- Maneja casos donde no hay datos (conteo = 0)
- Actualización automática cada segundo

### 5.6 SessionProgress - Barra de Progreso

Proporciona retroalimentación visual del avance de la sesión:

```typescript
const porcentaje = Math.min((actual / total) * 100, 100);

return (
  <div className="w-full bg-gray-200 rounded-full h-4">
    <div
      className="bg-blue-500 h-4 rounded-full text-right pr-2"
      style={{ width: `${porcentaje}%` }}
    >
      <span className="text-xs text-white">{porcentaje.toFixed(1)}%</span>
    </div>
  </div>
);
```

### 5.7 PostureTimelineTable - Tabla de Línea Temporal

Presenta un registro cronológico de las posturas detectadas:

```typescript
interface TimelineEntry {
  timestamp: string;
  postura: string;
  tiempo_mala_postura: number; // en segundos
}
```

**Características de visualización**:
- Formato de hora localizado
- Resaltado condicional para malas posturas
- Ordenamiento cronológico

---

## 6. Flujo de Datos y Comunicación

### 6.1 Patrones de Comunicación

El frontend implementa tres patrones principales de comunicación con el backend:

1. **HTTP REST API**: Para operaciones CRUD y consultas puntuales
2. **WebSocket**: Para streaming de video en tiempo real
3. **Polling HTTP**: Para actualización periódica de métricas

### 6.2 Endpoints Principales

```typescript
// Pacientes
GET /pacientes/{device_id}

// Sesiones
GET /sesiones/
GET /sesiones/progress/{session_id}
POST /sesiones/end/{device_id}
POST /sesiones/reiniciar/{session_id}

// Métricas
GET /metricas/{session_id}
GET /analysis/{session_id}
GET /timeline/{session_id}
GET /postura_counts/{session_id}

// Calibración
GET /calib/progress/{session_id}
POST /calib/mode/{device_id}/normal

// WebSocket
WS /video/output?device_id={device_id}
```

### 6.3 Gestión de Estado Asíncrono

El sistema maneja múltiples fuentes de datos asíncronas mediante:
- Hooks de React (`useEffect`)
- Limpieza de intervalos y conexiones
- Manejo de errores con bloques try-catch

---

## 7. Proceso de Calibración

### 7.1 Flujo de Calibración

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Usuario accede  │────▶│ Verifica estado  │────▶│ Redirige a      │
│ al sistema      │     │ de calibración   │     │ /calibracion    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                           │
                                                           ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Guarda estado   │◀────│ Postura correcta │◀────│ Muestra video   │
│ calibrado=1     │     │ por 10 segundos  │     │ y instrucciones │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### 7.2 Validación de Postura

El sistema valida la postura correcta mediante:
1. Detección continua de la posición del usuario
2. Contador de tiempo acumulado en postura correcta
3. Umbral de 10 segundos para completar calibración

### 7.3 Persistencia del Estado

```typescript
localStorage.setItem("calibrado", "1");
```

El estado de calibración se almacena localmente para:
- Evitar recalibraciones innecesarias
- Permitir forzar recalibración con parámetro URL
- Mantener estado entre recargas de página

---

## 8. Visualización de Datos en Tiempo Real

### 8.1 Arquitectura de Streaming

El sistema implementa streaming de video mediante:

```typescript
// Cliente WebSocket
const ws = new WebSocket(`ws://${host}:8765/video/output?device_id=${deviceId}`);
ws.binaryType = "arraybuffer";

// Procesamiento de frames
ws.onmessage = (event) => {
  const blob = new Blob([event.data], { type: "image/jpeg" });
  // Renderizado en canvas
};
```

### 8.2 Optimización de Rendimiento

1. **Gestión de Memoria**:
   - Liberación de URLs de objetos con `revokeObjectURL`
   - Reutilización del mismo canvas para todos los frames

2. **Throttling de Actualizaciones**:
   - Polling cada 1000ms para métricas
   - Polling cada 800ms para calibración
   - WebSocket sin throttling para video

3. **Renderizado Condicional**:
   - Componentes solo se actualizan cuando hay cambios
   - Uso de keys estables en listas

### 8.3 Indicadores Visuales

El sistema utiliza un esquema de colores semafórico:
- **Verde**: Estado óptimo (< 40% postura incorrecta)
- **Amarillo**: Advertencia (40-70% postura incorrecta)
- **Rojo**: Crítico (> 70% postura incorrecta)

---

## 9. Gestión de Sesiones

### 9.1 Ciclo de Vida de una Sesión

```
INICIO ──▶ CALIBRACIÓN ──▶ MONITOREO ──▶ FINALIZACIÓN
   │                           │               │
   └──────────────────────────┴───────────────┘
              (Reinicio de sesión)
```

### 9.2 Control de Finalización

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
    });
  }
}, [sessionEnded, deviceId]);
```

**Mecanismos de control**:
- Prevención de envíos duplicados mediante localStorage
- Limpieza automática del estado de calibración
- Notificación al backend del fin de sesión

### 9.3 Pantalla de Finalización

La interfaz de sesión finalizada proporciona:
- Mensaje de felicitación motivacional
- Estadísticas resumidas de la sesión
- Opción de iniciar nueva sesión

---

## 10. Despliegue y Producción

### 10.1 Proceso de Build

```bash
npm run build
```

Genera:
- Bundle optimizado y minificado
- Archivos con hash para cache busting
- Separación de código (code splitting)

### 10.2 Containerización con Docker

```dockerfile
# Etapa 1: Build con Node
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: Servir con nginx
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Ventajas del enfoque multi-stage**:
- Imagen final ligera (solo nginx + archivos estáticos)
- Separación entre entorno de build y producción
- Reproducibilidad garantizada

### 10.3 Configuración de Nginx

```nginx
server {
  listen 80;
  server_name localhost;
  
  location / {
    root   /usr/share/nginx/html;
    index  index.html index.htm;
    try_files $uri $uri/ /index.html;
  }
  
  error_page 404 /index.html;
}
```

**Características**:
- Soporte para SPA con fallback a index.html
- Configuración optimizada para archivos estáticos
- Compatible con React Router

---

## 11. Conclusiones y Mejoras Futuras

### 11.1 Fortalezas del Diseño Actual

1. **Arquitectura Modular**: Componentes bien separados y reutilizables
2. **Comunicación en Tiempo Real**: Implementación robusta de WebSockets y polling
3. **Experiencia de Usuario**: Interfaz intuitiva con retroalimentación visual clara
4. **Tipado Fuerte**: TypeScript previene errores en tiempo de desarrollo
5. **Rendimiento**: Optimizaciones para manejo eficiente de streaming de video

### 11.2 Áreas de Mejora Identificadas

1. **Gestión de Estado Global**:
   - Implementar Redux o Context API para estado compartido
   - Reducir prop drilling entre componentes

2. **Testing**:
   - Añadir pruebas unitarias para componentes críticos
   - Implementar pruebas de integración E2E

3. **Accesibilidad**:
   - Mejorar soporte para lectores de pantalla
   - Añadir navegación por teclado completa

4. **Internacionalización**:
   - Preparar la aplicación para múltiples idiomas
   - Separar textos hardcodeados

5. **Optimización de Red**:
   - Implementar reconexión automática de WebSocket
   - Añadir cache de datos para modo offline parcial

6. **Monitoreo en Producción**:
   - Integrar herramientas de APM (Application Performance Monitoring)
   - Añadir logging estructurado

### 11.3 Conclusión Final

El frontend desarrollado cumple exitosamente con los objetivos planteados, proporcionando una interfaz robusta y eficiente para el monitoreo postural en tiempo real. La arquitectura basada en componentes React con TypeScript ha demostrado ser una elección acertada, permitiendo un desarrollo ágil y mantenible. Las mejoras futuras identificadas representan oportunidades para evolucionar el sistema hacia una solución aún más completa y profesional.

---

## Anexo A: Definiciones de Tipos TypeScript

```typescript
export interface HistorialPosturalItem {
  nombre: string;
  conteo: number;
}

export interface PosturaData {
  actual: string;
  transiciones_malas: number;
  porcentaje_correcta: number;
  porcentaje_incorrecta: number;
  tiempo_parado: number;
  tiempo_sentado: number;
  alertas_enviadas: number;
}

export interface SessionData {
  id: string;
  intervalo_segundos: number;
  tiempo_transcurrido: number;
  modo: string;
}

export interface SessionProgressData {
  intervalo_segundos: number;
  elapsed: number; 
}

export interface PosturaMessage {
  timestamp: string;
  session: SessionData;
  postura: PosturaData;
  historial_postural: HistorialPosturalItem[];
}

export interface Paciente {
  id: number;
  telegram_id: string;
  device_id: string;
  nombre: string;
  edad: number;
  sexo: string | null;
  diagnostico: string | null;
}

export interface MetricaOut {
  id: string;
  sesion_id: string;
  timestamp: string;   
  datos: PosturaData;
  created_at: string; 
}

export interface AnalysisResponse {
  [label: string]: number;
}

export interface TimelineEntry {
  timestamp: string;
  postura: string;
  tiempo_mala_postura: number;
}
```

---

## Anexo B: Scripts de NPM

```json
{
  "scripts": {
    "start": "react-scripts start",      // Desarrollo local en puerto 3000
    "build": "react-scripts build",      // Build de producción
    "test": "react-scripts test",        // Ejecutar pruebas
    "eject": "react-scripts eject"       // Exponer configuración (irreversible)
  }
}
```
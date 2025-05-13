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
    intervalo_segundos: number;
    tiempo_transcurrido: number;
    modo: string;
  }
  
  export interface PosturaMessage {
    timestamp: string;
    session: SessionData;
    postura: PosturaData;
    historial_postural: HistorialPosturalItem[];
  }
  
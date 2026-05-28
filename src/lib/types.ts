// ============================================================================
//  WALLSS · Tipado estricto del dominio y del esquema Supabase.
// ============================================================================

/** Monedas soportadas por el sistema (blindaje para i18n: ARS hoy, EUR futuro). */
export type Moneda = "ARS" | "EUR";

/** Estado de un turno. Solo 'completado' suma a las ganancias. */
export type EstadoTurno = "pendiente" | "completado" | "ausente";

/** Fila de configuración global (singleton, id = 1). */
export type Configuracion = {
  id: number;
  moneda_activa: Moneda;
  /** Zona horaria IANA, p. ej. "America/Argentina/Buenos_Aires" o "Europe/Madrid". */
  zona_horaria: string;
  precio_corte: number;
  hora_apertura: number;
  hora_cierre: number;
  duracion_turno_min: number;
  /** Días de semana cerrados de forma recurrente (0=Dom … 6=Sáb). */
  dias_cerrados_semana: number[];
  actualizado_en: string;
};

/** Campos editables de la configuración desde el panel admin. */
export type ConfiguracionUpdate = Partial<
  Pick<
    Configuracion,
    | "moneda_activa"
    | "zona_horaria"
    | "precio_corte"
    | "hora_apertura"
    | "hora_cierre"
    | "duracion_turno_min"
    | "dias_cerrados_semana"
  >
>;

/** Feriado / cierre puntual. */
export type Feriado = {
  /** "YYYY-MM-DD". */
  fecha: string;
  descripcion: string | null;
};

/** Fila de la tabla `turnos`. Las fechas viajan como ISO 8601 (timestamptz). */
export type Turno = {
  id: string;
  nombre_cliente: string;
  telefono_cliente: string;
  /** ISO 8601 con offset, p. ej. "2026-05-28T13:30:00+00:00". */
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  estado: EstadoTurno;
  /** Precio congelado al completar el turno (null si no se completó). */
  precio_cobrado: number | null;
  recordatorio_enviado_en: string | null;
  creado_en: string;
};

/** Payload para crear un turno desde el panel público. */
export type NuevoTurno = {
  nombre_cliente: string;
  telefono_cliente: string;
  /** Instante de inicio en ISO 8601 (UTC). */
  fecha_hora_inicio: string;
};

/** Resultado uniforme de las server actions. */
export type ResultadoAccion<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; codigo?: CodigoError };

export type CodigoError =
  | "ANTELACION_INSUFICIENTE"
  | "SLOT_OCUPADO"
  | "DATOS_INVALIDOS"
  | "ERROR_DESCONOCIDO";

/** Entrada agregada del ERP de clientes. */
export interface ClienteResumen {
  telefono: string;
  nombre: string;
  total_turnos: number;
  ultimo_turno: string;
}

/** Punto del gráfico de ganancias mensuales. */
export interface GananciaMensual {
  /** "YYYY-MM". */
  mes: string;
  /** Etiqueta legible, p. ej. "may 2026". */
  etiqueta: string;
  total_turnos: number;
  ganancia: number;
}

// ----------------------------------------------------------------------------
//  Tipos para el cliente tipado de supabase-js.
// ----------------------------------------------------------------------------
export type Database = {
  public: {
    Tables: {
      configuracion: {
        Row: Configuracion;
        Insert: Partial<Configuracion> & { id?: number };
        Update: ConfiguracionUpdate & { actualizado_en?: string };
        Relationships: [];
      };
      turnos: {
        Row: Turno;
        Insert: NuevoTurno;
        Update: Partial<NuevoTurno> & {
          estado?: EstadoTurno;
          precio_cobrado?: number | null;
          recordatorio_enviado_en?: string | null;
        };
        Relationships: [];
      };
      feriados: {
        Row: Feriado;
        Insert: Feriado;
        Update: Partial<Feriado>;
        Relationships: [];
      };
    };
    Views: { [key: string]: never };
    Functions: { [key: string]: never };
    Enums: { [key: string]: never };
    CompositeTypes: { [key: string]: never };
  };
};

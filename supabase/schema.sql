-- ============================================================================
--  WALLSS · Sistema de Turnos · Esquema PostgreSQL (Supabase)
-- ----------------------------------------------------------------------------
--  Diseñado para internacionalización futura:
--    · Todas las marcas de tiempo se guardan como TIMESTAMP WITH TIME ZONE.
--    · La moneda y la zona horaria viven en una fila de configuración global.
--  Ejecutar este archivo completo en el SQL Editor de Supabase.
-- ============================================================================

-- gist es necesario para la restricción de exclusión sobre rangos de tiempo.
create extension if not exists btree_gist;

-- ============================================================================
--  1. CONFIGURACIÓN GLOBAL (singleton: una única fila con id = 1)
-- ============================================================================
create table if not exists public.configuracion (
  id                  smallint     primary key default 1,
  -- Moneda activa para formatear el dashboard con Intl.NumberFormat.
  moneda_activa       text         not null default 'ARS'
                        check (moneda_activa in ('ARS', 'EUR')),
  -- Zona horaria IANA (p. ej. 'America/Argentina/Buenos_Aires' o 'Europe/Madrid').
  zona_horaria        text         not null default 'America/Argentina/Buenos_Aires',
  -- Precio del corte: base para el gráfico de ganancias mensuales del MVP.
  precio_corte        numeric(12,2) not null default 0,
  -- Parámetros de la grilla de turnos (hora local de la barbería).
  hora_apertura       smallint     not null default 9   check (hora_apertura between 0 and 23),
  hora_cierre         smallint     not null default 20  check (hora_cierre   between 1 and 24),
  duracion_turno_min  smallint     not null default 30  check (duracion_turno_min > 0),
  actualizado_en      timestamptz  not null default now(),
  -- Garantiza que sólo exista una fila de configuración.
  constraint configuracion_singleton check (id = 1)
);

-- Fila inicial por defecto.
insert into public.configuracion (id) values (1)
on conflict (id) do nothing;

-- ============================================================================
--  2. TURNOS
-- ============================================================================
create table if not exists public.turnos (
  id                  uuid         primary key default gen_random_uuid(),
  nombre_cliente      text         not null check (length(trim(nombre_cliente)) > 0),
  telefono_cliente    text         not null check (length(trim(telefono_cliente)) > 0),
  -- OBLIGATORIO timestamptz: instante absoluto, independiente de la zona horaria.
  fecha_hora_inicio   timestamptz  not null,
  -- Fin del turno para detectar solapamientos por rango. Lo completa el trigger:
  -- NO puede ser GENERATED porque (timestamptz + interval) no es inmutable en PG.
  -- 30 min coincide con duracion_turno_min por defecto; ajustar si cambia la grilla.
  fecha_hora_fin      timestamptz  not null,
  -- Estado del turno. Solo 'completado' cuenta para las ganancias.
  estado              text         not null default 'pendiente'
                        check (estado in ('pendiente', 'completado', 'ausente')),
  creado_en           timestamptz  not null default now()
);

-- ----------------------------------------------------------------------------
--  2.a. Trigger: valida antelación mínima (>= 1 h) y calcula fecha_hora_fin.
--       NOW() es VOLATILE y no puede usarse en un CHECK, por eso usamos trigger.
-- ----------------------------------------------------------------------------
create or replace function public.preparar_turno()
returns trigger
language plpgsql
as $$
begin
  if new.fecha_hora_inicio <= now() + interval '1 hour' then
    raise exception 'ANTELACION_INSUFICIENTE: el turno debe reservarse con al menos 1 hora de antelación.'
      using errcode = 'check_violation';
  end if;
  new.fecha_hora_fin := new.fecha_hora_inicio + interval '30 minutes';
  return new;
end;
$$;

drop trigger if exists trg_preparar_turno on public.turnos;
create trigger trg_preparar_turno
  before insert or update of fecha_hora_inicio on public.turnos
  for each row
  execute function public.preparar_turno();

-- ----------------------------------------------------------------------------
--  2.b. Anti-solapamiento a nivel de base de datos.
--       Dos turnos no pueden tener rangos [inicio, fin) que se intersecten.
--       Cubre tanto la reserva exacta del mismo bloque como cualquier solape.
-- ----------------------------------------------------------------------------
alter table public.turnos
  drop constraint if exists turnos_sin_solapamiento;
alter table public.turnos
  add constraint turnos_sin_solapamiento
  exclude using gist (
    tstzrange(fecha_hora_inicio, fecha_hora_fin) with &&
  );

-- Índice para consultas por día/semana en el dashboard.
create index if not exists idx_turnos_fecha_hora_inicio
  on public.turnos (fecha_hora_inicio);

-- Índice para el ERP de clientes (agrupar por teléfono).
create index if not exists idx_turnos_telefono
  on public.turnos (telefono_cliente);

-- Índice para filtrar por estado (ganancias = solo 'completado').
create index if not exists idx_turnos_estado
  on public.turnos (estado);

-- ============================================================================
--  3. SEGURIDAD (Row Level Security)
-- ----------------------------------------------------------------------------
--  RLS habilitado SIN políticas para roles anónimos: todo el acceso ocurre
--  desde el servidor de Next.js con la service_role key (que omite RLS).
--  Así los datos personales (nombre/teléfono) nunca quedan expuestos al
--  cliente y la disponibilidad se calcula server-side.
-- ============================================================================
alter table public.turnos        enable row level security;
alter table public.configuracion enable row level security;

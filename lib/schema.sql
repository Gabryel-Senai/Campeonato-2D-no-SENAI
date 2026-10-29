-- ==========================================
-- 1. CRIAÇÃO DAS TABELAS
-- ==========================================

CREATE TABLE public.times (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nome text NOT NULL,
  cor text NOT NULL,
  pontos integer DEFAULT 0,
  vitorias integer DEFAULT 0,
  empates integer DEFAULT 0,
  derrotas integer DEFAULT 0,
  gols_pro integer DEFAULT 0,
  gols_contra integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT times_pkey PRIMARY KEY (id)
);

CREATE TABLE public.partidas (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  time_casa bigint,
  time_fora bigint,
  gols_casa integer DEFAULT 0,
  gols_fora integer DEFAULT 0,
  status text DEFAULT 'finalizada'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT partidas_pkey PRIMARY KEY (id),
  -- O 'ON DELETE CASCADE' garante que se um time for deletado, as partidas dele também serão.
  CONSTRAINT partidas_time_casa_fkey FOREIGN KEY (time_casa) REFERENCES public.times(id) ON DELETE CASCADE,
  CONSTRAINT partidas_time_fora_fkey FOREIGN KEY (time_fora) REFERENCES public.times(id) ON DELETE CASCADE
);

-- ==========================================
-- 2. INSERÇÃO DOS TIMES INICIAIS
-- ==========================================
-- A tabela de partidas começa vazia.
-- Os times são inseridos com as estatísticas zeradas. O ID será gerado automaticamente.

INSERT INTO public.times (nome, cor, pontos, vitorias, empates, derrotas, gols_pro, gols_contra, created_at) VALUES 
('Corinthians', '#111827', 0, 0, 0, 0, 0, 0, now()), 
('Palmeiras', '#16a34a', 0, 0, 0, 0, 0, 0, now()), 
('São Paulo', '#dc2626', 0, 0, 0, 0, 0, 0, now()), 
('Santos', '#f8fafc', 0, 0, 0, 0, 0, 0, now()), 
('Flamengo', '#ef4444', 0, 0, 0, 0, 0, 0, now()), 
('Vasco', '#0f172a', 0, 0, 0, 0, 0, 0, now()), 
('Grêmio', '#38bdf8', 0, 0, 0, 0, 0, 0, now()), 
('Internacional', '#b91c1c', 0, 0, 0, 0, 0, 0, now());

-- 1. Creează rolurile de bază
CREATE ROLE db_owner NOINHERIT LOGIN PASSWORD 'parola_super_puternica_de_cel_putin_32_caractere';
CREATE ROLE app_user NOINHERIT LOGIN PASSWORD 'parola_aplicatiei_tot_lunga_si_generata';
CREATE ROLE read_only NOINHERIT LOGIN PASSWORD 'parola_pentru_analytics';

-- 2. Asigură-te că schema public există
CREATE SCHEMA IF NOT EXISTS public;

-- 3. Proprietarul schemei este db_owner
ALTER SCHEMA public OWNER TO db_owner;

-- 4. Permisiuni minime pentru app_user
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;

-- 5. Pentru viitoarele tabele – aceleași permisiuni
ALTER DEFAULT PRIVILEGES FOR ROLE db_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;

-- 6. Permisiuni pentru read_only (doar citire)
GRANT USAGE ON SCHEMA public TO read_only;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO read_only;

ALTER DEFAULT PRIVILEGES FOR ROLE db_owner IN SCHEMA public
  GRANT SELECT ON TABLES TO read_only;



-- Timeout-uri – protecție împotriva conexiunilor blocate
-- 7. Interzice explicit crearea de tabele pentru app_user și read_only
REVOKE CREATE ON SCHEMA public FROM app_user, read_only;

-- La nivel de bază de date
ALTER DATABASE poeziiapi SET statement_timeout = '15s';
ALTER DATABASE poeziiapi SET idle_in_transaction_session_timeout = '60s';



-- Indexare pentru căutare
-- Index pe coloane frecvent filtrate
CREATE INDEX idx_poems_author_id ON poems(author_id);
CREATE INDEX idx_poems_year ON poems(year);
CREATE INDEX idx_poems_popularity ON poems(popularity DESC);

-- Index compus pentru filtrare multiplă
CREATE INDEX idx_poems_author_year ON poems(author_id, year);




-- Full-Text Search în limba română
-- Adaugă coloana pentru vectorul de căutare
ALTER TABLE poems ADD COLUMN search_vector tsvector;

-- Creează index GIN pentru căutare rapidă
CREATE INDEX idx_poems_fts ON poems USING GIN (search_vector);

-- Creează trigger pentru actualizare automată
CREATE FUNCTION poems_fts_trigger() RETURNS trigger AS $$
begin
  new.search_vector :=
    setweight(to_tsvector('romanian', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('romanian', coalesce(new.summary, '')), 'B') ||
    setweight(to_tsvector('romanian', coalesce(new.full_text, '')), 'C');
  return new;
end
$$ LANGUAGE plpgsql;

CREATE TRIGGER poems_fts_update
  BEFORE INSERT OR UPDATE ON poems
  FOR EACH ROW
  EXECUTE FUNCTION poems_fts_trigger();

-- Populează coloana pentru datele existente
UPDATE poems SET search_vector = 
  setweight(to_tsvector('romanian', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('romanian', coalesce(summary, '')), 'B') ||
  setweight(to_tsvector('romanian', coalesce(full_text, '')), 'C');


  -- Căutare
SELECT * FROM poems
WHERE search_vector @@ to_tsquery('romanian', 'eminescu & luceafăr')
ORDER BY ts_rank(search_vector, to_tsquery('romanian', 'eminescu & luceafăr')) DESC;





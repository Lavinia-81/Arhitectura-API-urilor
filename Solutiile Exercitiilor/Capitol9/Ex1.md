Ex1. Creează rolurile în PostgreSQL —> privilegii minime

-----

R => Script de inițializare roluri
```
-- user cu privilegii minime pentru aplicație
CREATE USER app_user WITH PASSWORD 'strong_password';
-- user cu privilegii totale pentru migrații
CREATE USER db_owner WITH PASSWORD 'owner_password';
-- db_owner controlează schema
GRANT ALL PRIVILEGES ON DATABASE poezii-api TO db_owner;
-- app_user are doar CRUD
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
-- IMPORTANT: app_user NU are CREATE TABLE, ALTER TABLE, DROP TABLE
```
-----

R => Verificare
```
SET ROLE app_user;
CREATE TABLE test (id INT);
```

Rezultat:
```ERROR: permission denied for schema public```

-----

Este exact ce ne trebuie.
Ex5. Testează restore-ul

-----

Creezi o bază de test
```CREATE DATABASE poezii_api_test;```

-----

Restore
```psql poezii_api_test < /backups/backup_2026-07-30_11-57.sql```

-----

Verifici datele
```SELECT * FROM work LIMIT 5;```

-----

Ștergi baza de test
```DROP DATABASE poezii_api_test;```
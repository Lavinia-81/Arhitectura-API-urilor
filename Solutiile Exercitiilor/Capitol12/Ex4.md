Ex4. Backup automat PostgreSQL

-----

R => Script: backup.sh
```
#!/bin/bash

DATE=$(date +"%Y-%m-%d_%H-%M")
FILE="/backups/backup_$DATE.sql"
pg_dump poezii_api > "$FILE"
find /backups -type f -mtime +7 -name "*.sql" -delete
echo "Backup complet: $FILE"
```
-----

R => Rulezi manual
```bash backup.sh```

-----

R => Verifici
```ls -lh /backups```

Backup-ul este creat.
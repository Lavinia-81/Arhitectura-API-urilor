Ex4. Automatizează un backup — script Bash

-----

backup.sh
```
#!/bin/bash

DATE=$(date +"%Y-%m-%d_%H-%M")
FILE="backup_$DATE.sql"
pg_dump poezii_api > /backups/$FILE

# șterge backup-urile mai vechi de 7 zile
find /backups -type f -mtime +7 -name "*.sql" -delete
echo "Backup complet: $FILE"
```
-----

Rulezi manual
```bash backup.sh```

-----

Verifici fișierul
```ls -lh /backups```
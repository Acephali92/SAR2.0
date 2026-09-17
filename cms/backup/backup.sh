#!/bin/sh
# M10: naechtliches Backup von Postgres (pg_dump) und dem Uploads-Volume, 14 Tage lokale Aufbewahrung.
# Restore-Prozedur: siehe docs/DEPLOYMENT.md ("Backups & Wiederherstellung").
set -eu

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
mkdir -p /backups

echo "[$TIMESTAMP] Backup gestartet..."

pg_dump -h postgres -U payload payload | gzip > "/backups/db-$TIMESTAMP.sql.gz"
tar czf "/backups/uploads-$TIMESTAMP.tar.gz" -C /data uploads

find /backups -name '*.gz' -mtime +14 -delete

echo "[$TIMESTAMP] Backup abgeschlossen: db-$TIMESTAMP.sql.gz, uploads-$TIMESTAMP.tar.gz"

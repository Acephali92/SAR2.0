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

# Optionale Offsite-Kopie (M10): nur aktiv, wenn ein rclone-Ziel UND eine rclone.conf konfiguriert
# sind. Ohne Konfiguration bleibt das Verhalten wie zuvor (nur lokales Backup).
if [ -n "${OFFSITE_RCLONE_REMOTE:-}" ] && [ -f /root/.config/rclone/rclone.conf ]; then
  echo "[$TIMESTAMP] Offsite-Kopie nach $OFFSITE_RCLONE_REMOTE ..."
  rclone copy /backups "$OFFSITE_RCLONE_REMOTE" --min-age 1m
  echo "[$TIMESTAMP] Offsite-Kopie abgeschlossen."
else
  echo "[$TIMESTAMP] Keine Offsite-Kopie konfiguriert (OFFSITE_RCLONE_REMOTE/rclone.conf fehlen) - nur lokales Backup."
fi

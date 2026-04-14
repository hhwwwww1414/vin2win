#!/usr/bin/env bash
set -euo pipefail
systemctl stop vin2win || true
cd /opt/vin2win
if [ -d .next ]; then
  cp -r .next .next_backup_20260325-011000
fi
rm -rf .next
find /opt/vin2win -maxdepth 1 | grep '\\' | while IFS= read -r path; do
  rm -rf -- "$path"
done || true
tar -xf /opt/vin2win/deploy-vin2win-20260325-011000-notifications-carbon.tar -C /opt/vin2win
chown -R www-data:www-data /opt/vin2win
systemctl start vin2win
systemctl is-active vin2win
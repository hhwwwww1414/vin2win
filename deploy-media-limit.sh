#!/usr/bin/env bash
set -euo pipefail
systemctl stop vin2win || true
cd /opt/vin2win
if [ -d .next ]; then
  cp -r .next .next_backup_20260325-143800
fi
rm -rf .next
tar -xf /opt/vin2win/deploy-vin2win-20260325-143800-media-limit.tar -C /opt/vin2win
chown -R www-data:www-data /opt/vin2win
python3 - <<'PY'
from pathlib import Path
path = Path('/etc/nginx/sites-available/vin2win')
text = path.read_text()
needle = "    server_name vin2win.ru www.vin2win.ru;\n"
insert = needle + "\n    client_max_body_size 700m;\n"
if 'client_max_body_size' not in text:
    text = text.replace(needle, insert, 1)
    path.write_text(text)
PY
nginx -t
systemctl reload nginx
systemctl start vin2win
systemctl is-active vin2win
curl -I -s http://localhost:3000 | head -n 1
#!/usr/bin/env bash
# Make the WSL Postgres reachable from the Windows host across reboots:
# listen on all interfaces + allow the host network, then print the WSL IP.
set -e
CONF=/etc/postgresql/14/main/postgresql.conf
HBA=/etc/postgresql/14/main/pg_hba.conf

sudo sed -i "s/^#\?listen_addresses.*/listen_addresses = '*'/" "$CONF"

# Dev-only: trust connections from the WSL/host subnets (md5/scram with our password).
if ! sudo grep -q "savingsapp-host-rule" "$HBA"; then
  echo "host all all 0.0.0.0/0 scram-sha-256 # savingsapp-host-rule" | sudo tee -a "$HBA" >/dev/null
fi

sudo pg_ctlcluster 14 main restart 2>&1 | tail -1 || sudo pg_ctlcluster 14 main start 2>&1 | tail -1
sleep 2
sudo -u postgres psql -tAc "ALTER USER postgres PASSWORD 'postgres';" >/dev/null 2>&1 || true

echo "LISTENERS:"
sudo ss -tlnp 2>/dev/null | grep 5432 || echo "no 5432"
echo "WSL_IP=$(hostname -I | awk '{print $1}')"

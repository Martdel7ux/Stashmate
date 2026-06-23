#!/usr/bin/env bash
set -e
sudo pg_ctlcluster 14 main start || true
sleep 2
sudo -u postgres psql -tAc "ALTER USER postgres PASSWORD 'postgres';"
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='savingsapp'" | grep -q 1; then
  sudo -u postgres createdb savingsapp
fi
echo "DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT datname FROM pg_database WHERE datname='savingsapp';")"
echo "--- listeners ---"
sudo ss -tlnp | grep 5432 || echo "no 5432 listener"

#!/bin/sh

mkdir /storage/database

echo "Running migrations..."
npm run db-migrate -- --force

echo "Starting the AdonisJS server..."
exec node ./bin/server.js

#!/bin/sh

echo "⏳ Waiting for PostgreSQL..."

until pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER
do
  sleep 2
done

echo "✅ PostgreSQL is ready"

echo "📦 Running migrations..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f ./migrations/001_init_schema.sql

echo "🌱 Running seed data..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f ./seeds/001_seed_data.sql

echo "🚀 Starting server..."
node src/server.js

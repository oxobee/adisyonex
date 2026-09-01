#!/bin/sh
set -e

echo "🚀 AdisyonEx Başlatılıyor..."

# If DATABASE_URL is provided, run prisma db push to ensure schema is synced
if [ -n "$DATABASE_URL" ]; then
  echo "📦 Veritabanı şeması senkronize ediliyor..."
  npx prisma db push --skip-generate || echo "⚠️ Veritabanı bağlantısı henüz hazır değil veya atlandı."
fi

exec "$@"

#!/bin/bash
# ==============================================================================
# AdisyonEx — Otomatik Sunucu Kurulum Betiği (Linux / macOS)
# ==============================================================================

set -e

# Renkler
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

clear
echo -e "${CYAN}"
echo "=================================================================="
echo "    🚀  ADISYONEX — OTOMATİK KURULUM VE YAYINLAMA SİHİRBAZI       "
echo "=================================================================="
echo -e "${NC}"

# 1. Kurulum Yöntemi Seçimi
echo -e "${YELLOW}Hangi yöntemle kurulum yapmak istersiniz?${NC}"
echo "1) 🐳 Docker ile Hızlı Kurulum (PostgreSQL + Uygulama tek komutla - ÖNERİLEN)"
echo "2) ⚡ Node.js & Yerel PostgreSQL ile Kurulum"
read -p "Seçiminiz (1 veya 2, Varsayılan: 1): " INSTALL_CHOICE
INSTALL_CHOICE=${INSTALL_CHOICE:-1}

if [ "$INSTALL_CHOICE" == "1" ]; then
    echo -e "\n${CYAN}>>> Docker kurulumu başlatılıyor...${NC}"
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ HATA: Sisteminizde Docker bulunamadı. Lütfen önce Docker yükleyin veya 2. seçeneği (Node.js) deneyin.${NC}"
        exit 1
    fi

    echo -e "${GREEN}✔ Docker tespit edildi.${NC}"
    echo "📦 Konteynerlar inşa ediliyor ve başlatılıyor..."
    
    docker compose down 2>/dev/null || true
    docker compose up --build -d

    echo -e "\n${GREEN}=================================================================="
    echo "  🎉 KURULUM TAMAMLANDI! ADISYONEX BAŞARIYLA BAŞLATILDI!        "
    echo "==================================================================${NC}"
    echo -e "🌐 Web Adresi:           ${CYAN}http://localhost:3000${NC}"
    echo -e "👑 Süper Admin Telefonu: ${CYAN}+905550570368${NC}"
    echo -e "📂 Veritabanı Portu:     ${CYAN}5432${NC}"
    echo -e "🛑 Durdurmak için:       ${YELLOW}docker compose down${NC}"
    echo -e "▶️  Tekrar başlatmak için: ${YELLOW}docker compose up -d${NC}"
    echo -e "📜 Logları izlemek için:  ${YELLOW}docker compose logs -f${NC}"
    echo "=================================================================="
    exit 0
fi

# 2. Node.js ile Kurulum
echo -e "\n${CYAN}>>> Node.js ortamı kontrol ediliyor...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ HATA: Node.js sistemde bulunamadı. Lütfen Node.js (v18+) yükleyin.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✔ Node.js tespit edildi: $NODE_VERSION${NC}"

# .env dosyası kontrolü
if [ ! -f .env ]; then
    echo "📝 .env dosyası oluşturuluyor..."
    if [ -f .env.example ]; then
        cp .env.example .env
    else
        cat << 'ENVEOF' > .env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/restro"
AUTH_SECRET="adisyonex-secret-key-32chars-min-change-this-in-prod-2026"
AUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST="true"
DISABLE_OTP="true"
SUPABASE_S3_ENDPOINT="https://nbgcemhwzlaizsrqkzdd.supabase.co/storage/v1/s3"
SUPABASE_S3_REGION="eu-central-1"
SUPABASE_S3_BUCKET_NAME="restro-media"
SUPABASE_S3_ACCESS_KEY="01fb75380da1cb2cac02f34b2b3b5270"
SUPABASE_S3_SECRET_KEY="53c8cf1c05196b2f005e19cbe146cb125748df720c4bd2be0fd07a16f889cd92"
ENVEOF
    fi
    echo -e "${GREEN}✔ .env dosyası hazırlandı.${NC}"
fi

echo "📦 Bağımlılıklar yükleniyor (npm install)..."
npm install

echo "⚙️ Prisma İstemcisi oluşturuluyor..."
npx prisma generate

echo "🗄️ Veritabanı şeması senkronize ediliyor..."
npx prisma db push || echo -e "${YELLOW}⚠️ Veritabanı bağlantısı sağlanamadıysa lütfen .env içindeki DATABASE_URL değerini kontrol edin.${NC}"

echo "🌱 İlk yönetici verileri yükleniyor (seed)..."
npx tsx prisma/seed.ts 2>/dev/null || true

echo "🔨 Üretim derlemesi oluşturuluyor (npm run build)..."
npm run build

echo -e "\n${GREEN}=================================================================="
echo "  🎉 KURULUM TAMAMLANDI!                                          "
echo "==================================================================${NC}"
echo "Uygulamayı başlatmak için:"
echo -e "  👉 ${CYAN}npm run start${NC}  (veya ${CYAN}pm2 start npm --name adisyonex -- start${NC})"
echo ""
echo -e "🌐 Web Adresi:           ${CYAN}http://localhost:3000${NC}"
echo -e "👑 Süper Admin Telefonu: ${CYAN}+905550570368${NC}"
echo "=================================================================="

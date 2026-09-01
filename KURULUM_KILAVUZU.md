# 🚀 AdisyonEx — Tam Kurulum, Dağıtım ve Yönetim Kılavuzu

Bu doküman, **AdisyonEx (Restoran, POS, KDS, Mutfak ve QR Menü Yönetim Sistemi)** uygulamasını sıfırdan herhangi bir sunucuya (Ubuntu, Debian, CentOS, macOS, Windows veya Cloud VPS) en kolay ve sorunsuz şekilde kurmanız için hazırlanmıştır.

---

## 📌 İçindekiler
1. [Sistem Gereksinimleri](#1-sistem-gereksinimleri)
2. [Hızlı Kurulum (Otomatik Sihirbaz)](#2-hızlı-kurulum-otomatik-sihirbaz)
3. [Yöntem 1: Docker ile Kurulum (Önerilen)](#3-yöntem-1-docker-ile-kurulum-en-kolay--önerilen)
4. [Yöntem 2: Linux VPS (Ubuntu/Debian) & PM2 + Nginx + SSL](#4-yöntem-2-linux-vps-ubuntudebian--pm2--nginx--ssl)
5. [Yöntem 3: Windows Sunucu Kurulumu](#5-yöntem-3-windows-sunucu-kurulumu)
6. [Veritabanı Yedekleme & Geri Yükleme](#6-veritabanı-yedekleme--geri-yükleme)
7. [Ortam Değişkenleri (.env) Açıklamaları](#7-ortam-değişkenleri-env-açıklamaları)
8. [İlk Giriş ve Süper Admin Hesabı](#8-ilk-giriş-ve-süper-admin-hesabı)
9. [Personel Girişi & Mutfak Ekranı](#9-personel-girişi--mutfak-ekranı)

---

## 1. Sistem Gereksinimleri

| Bileşen | Minimum | Önerilen |
|---|---|---|
| **İşletim Sistemi** | Ubuntu 20.04+, Debian 11+, macOS, Windows Server | Ubuntu 22.04 / 24.04 LTS |
| **İşlemci (CPU)** | 1 Çekirdek | 2+ Çekirdek |
| **Bellek (RAM)** | 1 GB RAM (Swap ile) | 2 GB+ RAM |
| **Disk Alanı** | 2 GB Boş Alan | 10 GB+ SSD |
| **Node.js Sürümü** | Node.js 18.x veya 20.x+ | Node.js 20 LTS veya 22 LTS |
| **Veritabanı** | PostgreSQL 14+ | PostgreSQL 16 (veya Neon / Supabase) |

---

## 2. Hızlı Kurulum (Otomatik Sihirbaz)

Paket içerisindeki tek komutluk kurulum sihirbazını çalıştırarak her şeyi otomatik yapabilirsiniz:

### Linux / macOS:
```bash
chmod +x install.sh
./install.sh
```

### Windows:
```cmd
install.bat
```

---

## 3. Yöntem 1: Docker ile Kurulum (En Kolay & Önerilen)

Docker ve Docker Compose sayesinde PostgreSQL veritabanı ve web uygulaması tek komutla ayağa kalkar.

### Adım 1: Proje Dizinine Girin
```bash
cd adisyonex
```

### Adım 2: Konteynerları Başlatın
```bash
docker compose up --build -d
```

### Adım 3: Durumu Kontrol Edin
```bash
docker compose ps
docker compose logs -f app
```

Uygulamanız **`http://SUNUCU_IP_ADRESI:3000`** adresinde anında çalışmaya başlar!

- **Durdurmak için:** `docker compose down`
- **Yeniden başlatmak için:** `docker compose restart`

---

## 4. Yöntem 2: Linux VPS (Ubuntu/Debian) & PM2 + Nginx + SSL

Kendi alan adınızla (Örn: `adisyon.firmaniz.com`) profesyonel bir VPS üzerinde çalıştırmak için:

### Adım 1: Sistem Güncellemesi ve Node.js Kurulumu
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential nginx postgresql postgresql-contrib

# Node.js 20 LTS Kurulumu
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PM2 Kurulumu (Uygulamanın arka planda sürekli çalışması için)
sudo npm install -g pm2
```

### Adım 2: PostgreSQL Veritabanı Oluşturma
```bash
sudo -u postgres psql
```
PostgreSQL terminalinde şu komutları çalıştırın:
```sql
CREATE DATABASE adisyonex_db;
CREATE USER adisyonex_user WITH ENCRYPTED PASSWORD 'GucluSifre2026!';
GRANT ALL PRIVILEGES ON DATABASE adisyonex_db TO adisyonex_user;
ALTER DATABASE adisyonex_db OWNER TO adisyonex_user;
\q
```

### Adım 3: Dosyaları Yükleme & Yapılandırma
Yedek arşivini sunucunuza açın:
```bash
cd /var/www/adisyonex

# .env dosyasını oluşturun
cp .env.example .env
nano .env
```

`.env` dosyasındaki `DATABASE_URL` satırını güncelleyin:
```env
DATABASE_URL="postgresql://adisyonex_user:GucluSifre2026!@localhost:5432/adisyonex_db"
AUTH_SECRET="en_az_32_karakterlik_guvenli_rastgele_bir_anahtar"
AUTH_URL="https://adisyon.firmaniz.com"
AUTH_TRUST_HOST="true"
DISABLE_OTP="true"
```

### Adım 4: Derleme ve Veritabanı Senkronizasyonu
```bash
npm install
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
npm run build
```

### Adım 5: PM2 ile Başlatma
```bash
pm2 start npm --name "adisyonex" -- start
pm2 save
pm2 startup
```

### Adım 6: Nginx Reverse Proxy ve Ücretsiz SSL (Certbot)
Nginx yapılandırma dosyası oluşturun:
```bash
sudo nano /etc/nginx/sites-available/adisyonex
```

İçeriğine şunları yapıştırın (Alan adınızı güncelleyin):
```nginx
server {
    server_name adisyon.firmaniz.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Etkinleştirin ve SSL sertifikası alın:
```bash
sudo ln -s /etc/nginx/sites-available/adisyonex /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Let's Encrypt Ücretsiz SSL
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d adisyon.firmaniz.com
```

---

## 5. Yöntem 3: Windows Sunucu Kurulumu

1. [Node.js Resmi Sitesinden](https://nodejs.org) Node.js LTS sürümünü indirin ve kurun.
2. [PostgreSQL Resmi Sitesinden](https://www.postgresql.org) PostgreSQL'i kurun.
3. Proje klasöründeki **`install.bat`** dosyasına çift tıklayın.
4. Kurulum bittiğinde `npm run start` komutuyla uygulamayı başlatın.

---

## 6. Veritabanı Yedekleme & Geri Yükleme

Paket içerisinde hazır SQL veritabanı yedeği yer almaktadır: `database_backup.sql`.

### Yedeği Geri Yüklemek İçin (PostgreSQL):
```bash
psql -U adisyonex_user -d adisyonex_db -f database_backup.sql
```

### Yeni Bir SQL Yedeği Almak İçin:
```bash
pg_dump -U adisyonex_user -d adisyonex_db -f yeni_yedek.sql
```

---

## 7. Ortam Değişkenleri (.env) Açıklamaları

| Değişken | Varsayılan | Açıklama |
|---|---|---|
| `DATABASE_URL` | `postgresql://...` | PostgreSQL bağlantı URI adresi |
| `AUTH_SECRET` | 32+ Karakter | Güvenli oturum imzalama anahtarı |
| `AUTH_URL` | `http://localhost:3000` | Sitenin çalıştığı tam alan adı |
| `AUTH_TRUST_HOST` | `true` | Reverse proxy arkasında çalışırken `true` olmalı |
| `DISABLE_OTP` | `true` | SMS API olmadan PIN/direkt giriş için `true` |
| `SUPABASE_S3_*` | Supabase Bilgileri | Medya, logo ve ürün görselleri için S3 depolama |

---

## 8. İlk Giriş ve Süper Admin Hesabı

Kurulum tamamlandıktan sonra hazır tanımlı olan Süper Admin hesabıyla giriş yapabilirsiniz:

- **Giriş URL:** `https://alanadiniz.com/login`
- **Ülke Kodu:** `+90`
- **Telefon Numarası:** `5550570368`
- **Süper Admin Paneli:** `https://alanadiniz.com/admin`

> 💡 *Süper Admin panelinden yeni restoranlar, lisans süreleri, satış temsilcileri ve kullanıcılar tanımlayabilirsiniz.*

---

## 9. Personel Girişi & Mutfak Ekranı

- **Personel Giriş URL Formatı:** `https://alanadiniz.com/{firma-kullanici-adi}/personals`  
  *(Örn: `https://alanadiniz.com/lezzet-restoran/personals` veya genel `https://alanadiniz.com/personelgiris`)*
- **PIN Doğrulama:** 4 haneli PIN girildiğinde **otomatik giriş** yapılır.
- **Kilit Ekranı:** Personel ekranın sağ üstündeki **"Ekranı Kilitle"** butonuna basarak PIN kilit ekranını açabilir.
- **Mutfak Ekranı:** Step-by-step renkli butonlarla hazırlanma aşamalarını yönetir ve Türkçe sesli sipariş duyuruları yapar.

---

**© 2026 AdisyonEx. Tüm hakları saklıdır.**

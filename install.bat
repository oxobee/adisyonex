@echo off
chcp 65001 > nul
cls
echo ==================================================================
echo     🚀 ADISYONEX — OTOMATIK WINDOWS KURULUM SIHIRBAZI
echo ==================================================================
echo.

if not exist .env (
    echo [.env] dosyasi olusturuluyor...
    copy .env.example .env > nul 2>&1 || (
        echo DATABASE_URL="postgresql://postgres:postgres@localhost:5432/restro"> .env
        echo AUTH_SECRET="adisyonex-secret-key-32chars-min-change-this-in-prod-2026">> .env
        echo AUTH_URL="http://localhost:3000">> .env
        echo AUTH_TRUST_HOST="true">> .env
        echo DISABLE_OTP="true">> .env
    )
    echo [OK] .env hazirlandi.
)

echo.
echo [1/4] Bagimliliklar yukleniyor (npm install)...
call npm install
if %errorlevel% neq 0 (
    echo [HATA] npm install basarisiz oldu. Lutfen Node.js yuklu oldugundan emin olun.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/4] Prisma client olusturuluyor...
call npx prisma generate

echo.
echo [3/4] Veritabani semasi senkronize ediliyor...
call npx prisma db push

echo.
echo [4/4] Uretim derlemesi aliniyor (npm run build)...
call npm run build

echo.
echo ==================================================================
echo   🎉 KURULUM BASARIYLA TAMAMLANDI!
echo ==================================================================
echo Uygulamayi baslatmak icin:
echo   npm run start
echo.
echo Web Adresi:           http://localhost:3000
echo Super Admin Tel:      +905550570368
echo ==================================================================
pause

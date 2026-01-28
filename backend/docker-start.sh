#!/bin/bash

# SarjEt Backend - Docker Quick Start Script
# Bu script Docker container'larını hızlıca başlatmanıza yardımcı olur

set -e

echo "🚀 SarjEt Backend Docker Setup"
echo "================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker yüklü değil. Lütfen Docker'ı yükleyin: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose yüklü değil. Lütfen Docker Compose'u yükleyin."
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env dosyası bulunamadı. .env.docker'dan kopyalanıyor..."
    cp .env.docker .env
    echo "✅ .env dosyası oluşturuldu. Lütfen içindeki değerleri güncelleyin!"
    echo ""
    echo "Önemli: Aşağıdaki değerleri mutlaka değiştirin:"
    echo "  - MYSQL_ROOT_PASSWORD"
    echo "  - MYSQL_PASSWORD"
    echo "  - JWT_SECRET"
    echo ""
    read -p "Devam etmek için Enter'a basın..."
fi

# Parse command line arguments
MODE=${1:-production}

if [ "$MODE" = "dev" ] || [ "$MODE" = "development" ]; then
    echo "📦 Development modunda başlatılıyor..."
    COMPOSE_FILES="-f docker-compose.yml -f docker-compose.dev.yml"
else
    echo "🏭 Production modunda başlatılıyor..."
    COMPOSE_FILES="-f docker-compose.yml"
fi

echo ""
echo "🔨 Docker image'ları build ediliyor..."
docker-compose $COMPOSE_FILES build

echo ""
echo "🚀 Container'lar başlatılıyor..."
docker-compose $COMPOSE_FILES up -d

echo ""
echo "⏳ Servislerin hazır olması bekleniyor..."
sleep 5

echo ""
echo "📊 Container durumu:"
docker-compose ps

echo ""
echo "✅ Setup tamamlandı!"
echo ""
echo "🔗 Servis URL'leri:"
echo "   Backend API: http://localhost:3000"
echo "   Health Check: http://localhost:3000/health"
if [ "$MODE" = "dev" ] || [ "$MODE" = "development" ]; then
    echo "   Adminer (DB): http://localhost:8080"
fi
echo ""
echo "📝 Yararlı komutlar:"
echo "   Logları görüntüle: docker-compose logs -f"
echo "   Container'ları durdur: docker-compose down"
echo "   Yeniden başlat: docker-compose restart"
echo ""

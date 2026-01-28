.PHONY: help build up down restart logs clean dev prod migrate seed studio health

# Default target
help:
	@echo "🚀 SarjEt Backend - Docker Commands"
	@echo "===================================="
	@echo ""
	@echo "Production:"
	@echo "  make build     - Docker image'ları build et"
	@echo "  make up        - Servisleri başlat (production)"
	@echo "  make down      - Servisleri durdur"
	@echo "  make restart   - Servisleri yeniden başlat"
	@echo "  make logs      - Logları görüntüle"
	@echo ""
	@echo "Development:"
	@echo "  make dev       - Development modunda başlat"
	@echo "  make dev-logs  - Development loglarını görüntüle"
	@echo ""
	@echo "Database:"
	@echo "  make migrate   - Prisma migration'ları çalıştır"
	@echo "  make seed      - Seed data ekle"
	@echo "  make studio    - Prisma Studio'yu aç"
	@echo "  make db-backup - Veritabanını yedekle"
	@echo ""
	@echo "Utility:"
	@echo "  make health    - Health check yap"
	@echo "  make clean     - Container'ları ve volume'ları sil"
	@echo "  make ps        - Container durumunu göster"
	@echo ""

# Production commands
build:
	@echo "🔨 Building Docker images..."
	docker-compose build

up:
	@echo "🚀 Starting services (production)..."
	docker-compose up -d
	@echo "✅ Services started!"
	@echo "Backend: http://localhost:3000"
	@echo "Health: http://localhost:3000/health"

down:
	@echo "⏹️  Stopping services..."
	docker-compose down

restart:
	@echo "🔄 Restarting services..."
	docker-compose restart

logs:
	@echo "📋 Showing logs (Ctrl+C to exit)..."
	docker-compose logs -f

ps:
	@echo "📊 Container status:"
	docker-compose ps

# Development commands
dev:
	@echo "🔧 Starting services (development)..."
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
	@echo "✅ Development services started!"
	@echo "Backend: http://localhost:3000"
	@echo "Adminer: http://localhost:8080"

dev-logs:
	@echo "📋 Showing development logs (Ctrl+C to exit)..."
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

dev-down:
	@echo "⏹️  Stopping development services..."
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

# Database commands
migrate:
	@echo "🗄️  Running Prisma migrations..."
	docker-compose exec backend npx prisma migrate deploy

migrate-dev:
	@echo "🗄️  Running Prisma migrations (dev)..."
	docker-compose exec backend npx prisma migrate dev

seed:
	@echo "🌱 Seeding database..."
	docker-compose exec backend npm run prisma:seed

studio:
	@echo "🎨 Opening Prisma Studio..."
	@echo "Access at: http://localhost:5555"
	docker-compose exec backend npx prisma studio

db-backup:
	@echo "💾 Backing up database..."
	@mkdir -p backups
	docker-compose exec mysql mysqldump -u sarjet_user -p sarjet > backups/backup-$$(date +%Y%m%d-%H%M%S).sql
	@echo "✅ Backup completed!"

# Utility commands
health:
	@echo "🏥 Checking health..."
	@curl -f http://localhost:3000/health || echo "❌ Backend is not healthy"

clean:
	@echo "🧹 Cleaning up..."
	docker-compose down -v
	@echo "⚠️  All containers and volumes removed!"

rebuild:
	@echo "🔨 Rebuilding and restarting..."
	docker-compose up -d --build

shell:
	@echo "🐚 Opening backend shell..."
	docker-compose exec backend sh

mysql-shell:
	@echo "🐚 Opening MySQL shell..."
	docker-compose exec mysql mysql -u sarjet_user -p sarjet

# Quick start script
quick-start:
	@chmod +x docker-start.sh
	@./docker-start.sh

prod: up

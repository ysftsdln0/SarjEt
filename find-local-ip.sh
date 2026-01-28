#!/bin/bash

# SarjEt - Local Network IP Bulucu
# Bu script local network IP adresinizi bulur ve .env dosyasını güncellemenize yardımcı olur

echo "🔍 SarjEt - Local Network IP Bulucu"
echo "===================================="
echo ""

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "📱 macOS tespit edildi..."
    echo ""
    echo "Local IP adresiniz:"
    LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)
    
    if [ -z "$LOCAL_IP" ]; then
        echo "❌ Local IP bulunamadı. WiFi'ye bağlı olduğunuzdan emin olun."
        exit 1
    fi
    
    echo "✅ $LOCAL_IP"
    echo ""
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    echo "📱 Linux tespit edildi..."
    echo ""
    echo "Local IP adresiniz:"
    LOCAL_IP=$(hostname -I | awk '{print $1}')
    
    if [ -z "$LOCAL_IP" ]; then
        echo "❌ Local IP bulunamadı. WiFi'ye bağlı olduğunuzdan emin olun."
        exit 1
    fi
    
    echo "✅ $LOCAL_IP"
    echo ""
    
else
    echo "❌ Desteklenmeyen işletim sistemi: $OSTYPE"
    echo "Manuel olarak IP adresinizi bulun:"
    echo "  macOS/Linux: ifconfig | grep \"inet \" | grep -v 127.0.0.1"
    echo "  Windows: ipconfig | findstr IPv4"
    exit 1
fi

# Show backend URL
BACKEND_URL="http://${LOCAL_IP}:3000"
echo "🔗 Backend URL:"
echo "   $BACKEND_URL"
echo ""

# Ask if user wants to update .env
echo "📝 .env dosyasını güncellemek ister misiniz?"
echo ""
echo "Güncellenecek değer:"
echo "  EXPO_PUBLIC_BACKEND_URL=$BACKEND_URL"
echo ""
read -p "Devam etmek için 'y' yazın (Enter = hayır): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Update .env file
    if [ -f ".env" ]; then
        # Backup original
        cp .env .env.backup
        echo "✅ .env dosyası yedeklendi (.env.backup)"
        
        # Update EXPO_PUBLIC_BACKEND_URL
        if grep -q "EXPO_PUBLIC_BACKEND_URL=" .env; then
            # Replace existing value
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS sed syntax
                sed -i '' "s|^EXPO_PUBLIC_BACKEND_URL=.*|EXPO_PUBLIC_BACKEND_URL=$BACKEND_URL|g" .env
            else
                # Linux sed syntax
                sed -i "s|^EXPO_PUBLIC_BACKEND_URL=.*|EXPO_PUBLIC_BACKEND_URL=$BACKEND_URL|g" .env
            fi
            echo "✅ .env dosyası güncellendi!"
        else
            echo "❌ EXPO_PUBLIC_BACKEND_URL bulunamadı .env dosyasında"
        fi
    else
        echo "❌ .env dosyası bulunamadı"
    fi
else
    echo "⏭️  .env güncellenmedi."
    echo ""
    echo "Manuel güncelleme için .env dosyasındaki şu satırı değiştirin:"
    echo "  EXPO_PUBLIC_BACKEND_URL=$BACKEND_URL"
fi

echo ""
echo "📱 Fiziksel Cihazdan Test İçin:"
echo "   1. Backend'i başlatın: cd backend && docker-compose up -d"
echo "   2. Backend health check: curl $BACKEND_URL/health"
echo "   3. Mobil cihazınızın aynı WiFi ağında olduğundan emin olun"
echo "   4. Expo uygulamasını başlatın: npm start"
echo ""
echo "✅ Hazır!"

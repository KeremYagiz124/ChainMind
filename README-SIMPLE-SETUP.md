# ChainMind - Basit Kurulum Rehberi

Bu rehber Docker kullanmadan ChainMind projesini hızlıca çalıştırmanız için hazırlanmıştır.

## Gereksinimler

- Node.js 18+ 
- PostgreSQL (yerel kurulum)
- Redis (opsiyonel - cache için)

## Hızlı Başlangıç

### 1. Backend Kurulumu

```bash
cd backend
npm install
```

### 2. Environment Dosyalarını Oluşturun

```bash
# Backend için
cd backend
copy .env.example .env

# Frontend için  
cd ../frontend
copy .env.example .env
```

### 3. Veritabanı Kurulumu

PostgreSQL'i yerel olarak kurun ve çalıştırın:

```bash
# Backend dizininde
cd backend
npx prisma migrate dev
npx prisma generate
npm run prisma:seed
```

### 4. Backend'i Çalıştırın

```bash
cd backend
npm run dev
```

Backend http://localhost:3001 adresinde çalışacak.

### 5. Frontend'i Çalıştırın

Yeni terminal açın:

```bash
cd frontend
npm install
npm start
```

Frontend http://localhost:3000 adresinde çalışacak.

## Önemli Notlar

- Redis kurulu değilse backend yine de çalışır (cache olmadan)
- API anahtarları .env dosyasında tanımlanmalı
- Wallet bağlantısı için WalletConnect Project ID gerekli

## API Anahtarları

Aşağıdaki servislerin API anahtarlarını .env dosyasına eklemeniz gerekiyor:

- OpenAI API Key (AI chat için)
- WalletConnect Project ID (wallet bağlantısı için)
- Alchemy API Key (blockchain verisi için)

## Sorun Giderme

1. Port çakışması varsa .env dosyasında PORT değerini değiştirin
2. Veritabanı bağlantı hatası varsa DATABASE_URL'i kontrol edin
3. CORS hatası varsa CORS_ORIGIN ayarını kontrol edin

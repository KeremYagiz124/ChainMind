# MongoDB Setup Guide for ChainMind

## Quick Setup Options

### Option 1: MongoDB Atlas (Recommended for Hackathon)
**Free tier with replica set support out of the box**

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account
3. Create new cluster (free M0 tier)
4. Get connection string:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/chainmind_db
   ```
5. Update your `.env` file:
   ```bash
   DATABASE_URL="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/chainmind_db"
   ```

### Option 2: Local MongoDB with Replica Set
**For development without internet dependency**

1. **Install MongoDB Community Server**
   - Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
   - Install with default settings

2. **Configure Replica Set** (Required for Prisma transactions)
   ```bash
   # Create data directory
   mkdir C:\data\db
   
   # Start MongoDB with replica set
   mongod --replSet rs0 --port 27017 --dbpath C:\data\db
   
   # In another terminal, initialize replica set
   mongosh
   rs.initiate()
   ```

3. **Update .env file:**
   ```bash
   DATABASE_URL="mongodb://localhost:27017/chainmind_db?replicaSet=rs0"
   ```

## Backend Setup Steps

1. **Copy environment variables:**
   ```bash
   cd backend
   copy .env.example .env
   ```

2. **Update DATABASE_URL in .env:**
   ```bash
   # For Atlas:
   DATABASE_URL="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/chainmind_db"
   
   # For Local:
   DATABASE_URL="mongodb://localhost:27017/chainmind_db?replicaSet=rs0"
   ```

3. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

4. **Push schema to database:**
   ```bash
   npx prisma db push
   ```

5. **Start backend:**
   ```bash
   npm run dev
   ```

## Troubleshooting

### Error: "Transactions are not supported by this deployment"
- **Cause:** MongoDB instance doesn't have replica set configured
- **Solution:** Use MongoDB Atlas or configure local replica set (see Option 2 above)

### Connection Issues
- Check if MongoDB service is running
- Verify connection string format
- Ensure network access (for Atlas, whitelist your IP)

## Why MongoDB for ChainMind?

✅ **Perfect for hackathon**: Fast setup with Atlas
✅ **JSON-native**: Ideal for chat messages and metadata
✅ **Flexible schema**: Easy to iterate during development
✅ **Sponsor compatible**: No database restrictions from ETHOnline sponsors
✅ **Prisma support**: Full ORM support with type safety

## Next Steps

1. Choose setup option (Atlas recommended)
2. Update `.env` file with connection string
3. Run `npx prisma db push` to create collections
4. Start backend with `npm run dev`
5. Test with frontend at `http://localhost:3000`

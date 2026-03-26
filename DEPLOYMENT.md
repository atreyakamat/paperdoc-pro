# Deployment Guide - Personal Paperwork OS

Complete guide for deploying Personal Paperwork OS to production.

---

## Quick Deploy Options

### Option 1: Vercel (Recommended - Easiest)

**Perfect for**: Quick deployment with zero configuration

1. **Fork/Clone the repository** to your GitHub account

2. **Set up PostgreSQL database** (choose one):
   - [Supabase](https://supabase.com) - 500MB free
   - [Neon](https://neon.tech) - 512MB free
   - [Railway](https://railway.app) - $5/month credit

3. **Deploy to Vercel**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy
   vercel
   ```

   Or use the [Vercel Dashboard](https://vercel.com/new):
   - Import your Git repository
   - Vercel auto-detects Next.js

4. **Configure Environment Variables** in Vercel Dashboard:
   ```
   DATABASE_URL=postgresql://user:pass@host:5432/dbname
   AUTH_SECRET=<64-char-hex-secret>
   SHARE_LINK_SECRET=<64-char-hex-secret>
   NODE_ENV=production
   ```

   Generate secrets:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. **Run database migrations**:
   ```bash
   DATABASE_URL="your-prod-url" npx prisma db push
   ```

6. **Done!** Your app is live at `https://your-project.vercel.app`

---

### Option 2: Docker + Any Cloud Provider

**Perfect for**: Self-hosting, full control, VPS deployment

#### Prerequisites
- Docker installed
- PostgreSQL database (can be containerized or hosted)

#### Build & Run

1. **Create production `.env` file**:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with production values:
   ```
   DATABASE_URL="postgresql://user:pass@host:5432/dbname?sslmode=require"
   AUTH_SECRET="your-production-secret"
   SHARE_LINK_SECRET="your-production-secret"
   NODE_ENV="production"
   ```

2. **Build Docker image**:
   ```bash
   docker build -t paperdoc-pro .
   ```

3. **Run database migrations**:
   ```bash
   docker run --env-file .env paperdoc-pro npx prisma db push
   ```

4. **Start the container**:
   ```bash
   docker run -d \
     --name paperdoc \
     -p 3000:3000 \
     --env-file .env \
     paperdoc-pro
   ```

5. **Verify it's running**:
   ```bash
   curl http://localhost:3000/api/health
   ```

#### Using Docker Compose (Full Stack)

```yaml
# docker-compose.prod.yml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: paperdoc
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: unless-stopped

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@db:5432/paperdoc
      AUTH_SECRET: ${AUTH_SECRET}
      SHARE_LINK_SECRET: ${SHARE_LINK_SECRET}
      NODE_ENV: production
    depends_on:
      - db
    restart: unless-stopped

volumes:
  pgdata:
```

Run with:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

### Option 3: VPS / Cloud VM (Ubuntu/Debian)

**Perfect for**: Full control, custom setup, cost optimization

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Create database
sudo -u postgres psql -c "CREATE DATABASE paperdoc;"
sudo -u postgres psql -c "CREATE USER paperdoc WITH PASSWORD 'your-password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE paperdoc TO paperdoc;"
```

#### 2. Application Setup

```bash
# Clone repository
cd /opt
sudo git clone <your-repo-url> paperdoc-pro
cd paperdoc-pro

# Install dependencies
npm ci --production=false

# Create .env file
sudo nano .env
```

Add:
```env
DATABASE_URL="postgresql://paperdoc:your-password@localhost:5432/paperdoc"
AUTH_SECRET="your-secret"
SHARE_LINK_SECRET="your-secret"
NODE_ENV="production"
```

```bash
# Run migrations
npx prisma db push

# Build application
npm run build

# Install PM2 for process management
sudo npm install -g pm2

# Start application
pm2 start npm --name "paperdoc" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

#### 3. Nginx Reverse Proxy (with SSL)

```bash
# Install Nginx and Certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/paperdoc
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/paperdoc /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

---

### Option 4: Railway

**Perfect for**: Easy deployment with database included

1. **Install Railway CLI**:
   ```bash
   npm i -g @railway/cli
   ```

2. **Login and initialize**:
   ```bash
   railway login
   railway init
   ```

3. **Add PostgreSQL**:
   ```bash
   railway add --plugin postgresql
   ```

4. **Set environment variables**:
   ```bash
   railway variables set AUTH_SECRET="your-secret"
   railway variables set SHARE_LINK_SECRET="your-secret"
   railway variables set NODE_ENV="production"
   ```

5. **Deploy**:
   ```bash
   railway up
   ```

6. **Run migrations**:
   ```bash
   railway run npx prisma db push
   ```

---

## Post-Deployment Checklist

- [ ] Verify `/api/health` endpoint returns healthy status
- [ ] Test user registration and login
- [ ] Test document creation
- [ ] Test secure share link generation
- [ ] Test family member addition
- [ ] Set up monitoring (Vercel Analytics, Sentry, etc.)
- [ ] Configure custom domain (if applicable)
- [ ] Set up automatic database backups
- [ ] Test on mobile devices
- [ ] Set up error logging
- [ ] Configure email notifications (future)

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `AUTH_SECRET` | ✅ | Secret for JWT signing (64 chars) |
| `SHARE_LINK_SECRET` | ✅ | Secret for share tokens (64 chars) |
| `NODE_ENV` | ✅ | `production` or `development` |
| `PORT` | ❌ | Port number (default: 3000) |

---

## Monitoring & Maintenance

### Health Check
```bash
curl https://your-domain.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-26T08:00:00.000Z",
  "database": "connected",
  "version": "0.1.0"
}
```

### Database Backups

**For self-hosted PostgreSQL**:
```bash
# Backup
pg_dump -U paperdoc paperdoc > backup_$(date +%Y%m%d).sql

# Restore
psql -U paperdoc paperdoc < backup_20260326.sql
```

**For managed databases**: Use provider's backup features (Supabase, Neon, Railway all have automatic backups)

### Application Logs

**Vercel**: Check logs in Vercel Dashboard

**PM2**:
```bash
pm2 logs paperdoc
pm2 monit
```

**Docker**:
```bash
docker logs paperdoc
docker logs -f paperdoc  # Follow logs
```

---

## Scaling Considerations

### Database
- Start with Supabase/Neon free tier (good for 100-1000 users)
- Upgrade to paid tier when needed
- Add read replicas for high traffic
- Implement connection pooling (PgBouncer)

### Application
- **Vercel**: Auto-scales, no configuration needed
- **Docker**: Use container orchestration (Docker Swarm, Kubernetes)
- **VPS**: Use load balancer (Nginx) + multiple app instances

### Storage (for future file uploads)
- AWS S3 / Cloudflare R2
- Backblaze B2 (cheapest)
- Supabase Storage

---

## Troubleshooting

### Build fails
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Database connection fails
- Check `DATABASE_URL` is correct
- Ensure SSL mode is configured (`?sslmode=require` for hosted DBs)
- Verify firewall rules allow connection
- Test connection: `npx prisma db pull`

### App crashes
```bash
# Check logs
pm2 logs paperdoc --err

# Restart app
pm2 restart paperdoc
```

---

## Security Best Practices

1. ✅ **Never commit `.env` files** (already in .gitignore)
2. ✅ **Use strong secrets** (64-character random hex)
3. ✅ **Enable HTTPS** (SSL certificates)
4. ✅ **Keep dependencies updated** (`npm audit`, `npm update`)
5. ✅ **Use security headers** (already configured in next.config.ts)
6. ⚠️  **Set up rate limiting** (use Vercel's built-in or add middleware)
7. ⚠️  **Enable database backups** (automatic with managed providers)
8. ⚠️  **Monitor error logs** (Sentry, Vercel, etc.)

---

## Cost Estimates (India)

### Free Tier (0-100 users)
- **Database**: Supabase/Neon (₹0)
- **Hosting**: Vercel (₹0)
- **Total**: ₹0/month

### Small Scale (100-1000 users)
- **Database**: Supabase Pro (₹2000/month)
- **Hosting**: Vercel Pro (₹1600/month)
- **Total**: ~₹3600/month

### Medium Scale (1000-10000 users)
- **Database**: Managed PostgreSQL (₹5000-10000/month)
- **Hosting**: Vercel Enterprise or VPS (₹5000-15000/month)
- **Total**: ~₹10000-25000/month

---

## Support

For deployment issues:
1. Check `/api/health` endpoint
2. Review application logs
3. Verify environment variables
4. Check database connectivity
5. Open GitHub issue with logs

---

**Made for India · Personal Paperwork OS**

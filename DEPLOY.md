# The Archive by Balboni - Deploy de social.balbonilab.com

## Prerequisites (Ubuntu VPS)

```bash
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2
sudo npm install -g pm2

# PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Nginx + Certbot
sudo apt install -y nginx certbot python3-certbot-nginx
```

---

## 1. PostgreSQL Setup

```bash
sudo -u postgres psql

-- Inside psql:
CREATE USER mayra_user WITH PASSWORD 'your_strong_password';
CREATE DATABASE mayra_social OWNER mayra_user;
GRANT ALL PRIVILEGES ON DATABASE mayra_social TO mayra_user;
\q

# Run the schema
psql -U mayra_user -d mayra_social -f /path/to/backend/src/db/schema.sql
```

---

## 2. Backend Setup

```bash
# Clone / upload your project to the server, then:
cd /var/www/mayra-social/backend

npm install

# Create .env from example
cp .env.example .env
nano .env
```

Fill in `.env`:
```
PORT=4016
DATABASE_URL=postgresql://mayra_user:your_strong_password@localhost:5432/mayra_social
DATABASE_SSL=false
JWT_SECRET=generate_a_64_char_random_string_here
JWT_EXPIRES_IN=30d
PASSWORD_RECOVERY_CODE=generate_a_private_code_at_least_12_chars
NODE_ENV=production
FRONTEND_URL=https://social.balbonilab.com
UPLOAD_DIR=/var/www/mayra-social/backend/storage/uploads

# Web Push / VAPID (required for push notifications)
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:seu@email.com
```

Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Generate VAPID keys (one time, on the server):
```bash
cd /var/www/mayra-social/backend
npx web-push generate-vapid-keys
# Copy the output into VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env
```

---

## 3. PM2 — Start Backend

Create `ecosystem.config.js` in the project root:

```js
module.exports = {
  apps: [
    {
      name: 'mayra-social-api',
      cwd: '/var/www/mayra-social/backend',
      script: 'src/server.js',
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
}
```

```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup   # follow the printed command to enable on reboot
```

### Attachment storage

Attachments are stored on disk and are never exposed directly by Nginx. Create
the directory before starting the API and grant it only to the backend user:

```bash
sudo mkdir -p /var/www/mayra-social/backend/storage/uploads
sudo chown -R www-data:www-data /var/www/mayra-social/backend/storage
sudo chmod 750 /var/www/mayra-social/backend/storage/uploads
```

Back up both PostgreSQL and `backend/storage/uploads`; restoring only the database
will not restore uploaded files. Do not add a public Nginx `location` for this
directory. All viewing and downloads must continue through the authenticated API.

---

## 4. Frontend Build

```bash
cd /var/www/mayra-social

# Build (VITE_API_URL defaults to /api, which Nginx will proxy)
npm install
npm run build

# The output is in dist/
```

---

## 5. Nginx Configuration

Create `/etc/nginx/sites-available/mayra-social`:

```nginx
server {
    listen 80;
    server_name social.balbonilab.com;

    # API proxy
    location /api/ {
        proxy_pass         http://127.0.0.1:4016;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        client_max_body_size 25m;
    }

    # Frontend (SPA)
    location / {
        root  /var/www/mayra-social/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/mayra-social /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 6. SSL with Certbot

```bash
sudo certbot --nginx --redirect -d social.balbonilab.com
# Certbot will automatically update the Nginx config for HTTPS
sudo systemctl reload nginx
```

---

## 7. Verify

```bash
# Check API health
curl https://social.balbonilab.com/api/health
# Expected: {"ok":true}

# Check PM2 status
pm2 status

# View logs
pm2 logs mayra-social-api
```

---

## Updating

```bash
# Pull latest code, then:
cd /var/www/mayra-social
npm run build          # rebuild frontend

cd backend
npm install            # if dependencies changed
pm2 restart mayra-social-api
```

---

## Resetting a forgotten password

Run this only on the backend server, where `backend/.env` contains the production
`DATABASE_URL`:

```bash
cd /var/www/mayra-social/backend
npm run reset-password -- @mayrabalboni
```

The command replaces the stored password hash. It never displays or recovers the
old password. The new password is requested interactively so it is not stored in
the shell history.

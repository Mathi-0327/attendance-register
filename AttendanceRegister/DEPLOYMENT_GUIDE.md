# 🚀 Deployment Guide - Attendance Register System

## Overview

Your Attendance Register system can be deployed in several ways depending on your needs:

1. **Local Network Deployment** (Recommended for institutions)
2. **Cloud Deployment** (For internet access)
3. **Windows Server Deployment**
4. **Linux Server Deployment**
5. **Docker Deployment**

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All features tested and working
- [ ] Database is properly initialized
- [ ] Environment variables configured
- [ ] Security settings reviewed
- [ ] Backup strategy in place
- [ ] Admin password changed from default

---

## 🏢 Option 1: Local Network Deployment (Recommended)

**Best for:** Schools, colleges, offices with local network

### Advantages:
✅ No internet required  
✅ Fast and secure  
✅ No hosting costs  
✅ Full data control  
✅ Works on existing infrastructure  

### Requirements:
- A dedicated computer/server on your network
- Windows 10/11 or Linux
- Node.js 18+ installed
- Network access for all users

### Step-by-Step Deployment:

#### 1. Prepare the Server Computer

**Minimum Specs:**
- CPU: Intel Core i3 or equivalent
- RAM: 4GB (8GB recommended)
- Storage: 50GB available
- OS: Windows 10/11 or Ubuntu 20.04+

#### 2. Install Node.js

**Windows:**
1. Download from https://nodejs.org/
2. Run installer
3. Verify: `node --version`

**Linux:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 3. Copy Project to Server

**Option A: Using USB Drive**
1. Copy entire project folder to USB
2. Transfer to server
3. Place in `C:\AttendanceRegister` (Windows) or `/opt/attendance` (Linux)

**Option B: Using Git**
```bash
# If you have Git repository
git clone <your-repo-url>
cd AttendanceRegister
```

#### 4. Install Dependencies

```bash
cd d:\AttendanceRegister\AttendanceRegister  # Windows
# or
cd /opt/attendance/AttendanceRegister        # Linux

npm install --production
```

#### 5. Build for Production

```bash
npm run build
```

This creates optimized production files.

#### 6. Configure Environment

Create `.env` file:
```env
NODE_ENV=production
PORT=5000
ADMIN_PASSWORD=YourSecurePassword123!
```

#### 7. Start the Server

**For Testing:**
```bash
npm start
```

**For Production (Auto-restart):**

Install PM2 (Process Manager):
```bash
npm install -g pm2
```

Start with PM2:
```bash
pm2 start dist/index.cjs --name attendance-system
pm2 save
pm2 startup  # Auto-start on system boot
```

#### 8. Configure Firewall

**Windows Firewall:**
1. Open Windows Defender Firewall
2. Advanced Settings → Inbound Rules
3. New Rule → Port → TCP → 5000
4. Allow the connection
5. Name: "Attendance System"

**Linux (UFW):**
```bash
sudo ufw allow 5000/tcp
sudo ufw enable
```

#### 9. Find Server IP Address

**Windows:**
```bash
ipconfig
# Look for IPv4 Address (e.g., 192.168.1.100)
```

**Linux:**
```bash
ip addr show
# or
hostname -I
```

#### 10. Access from Other Devices

Users can now access:
```
http://[SERVER-IP]:5000
Example: http://192.168.1.100:5000
```

### Making it Easier for Users:

**Option A: Use Computer Name**
```
http://attendance-server:5000
```

**Option B: Set Static IP**
Configure router to assign fixed IP to server

**Option C: Create Shortcut**
Create desktop shortcuts with the URL for easy access

---

## ☁️ Option 2: Cloud Deployment

**Best for:** Remote access, multiple locations, internet-based access

### 2A. Deploy to Render (Free Tier Available)

**Steps:**

1. **Create Render Account**
   - Go to https://render.com
   - Sign up (free)

2. **Push Code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo>
   git push -u origin main
   ```

3. **Create New Web Service on Render**
   - Click "New +" → "Web Service"
   - Connect GitHub repository
   - Configure:
     - **Name**: attendance-register
     - **Environment**: Node
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
     - **Instance Type**: Free

4. **Add Environment Variables**
   - `NODE_ENV=production`
   - `PORT=5000`

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Access at: `https://attendance-register.onrender.com`

**Note:** Free tier sleeps after inactivity. Upgrade to paid tier ($7/month) for always-on service.

### 2B. Deploy to Railway (Easy Setup)

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure**
   - Railway auto-detects Node.js
   - Add environment variables in Settings
   - Deploy automatically

4. **Access**
   - Get URL from Railway dashboard
   - Example: `https://attendance-register.up.railway.app`

**Cost:** Free tier includes $5 credit/month, then $5-20/month

### 2C. Deploy to Heroku

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Login**
   ```bash
   heroku login
   ```

3. **Create App**
   ```bash
   heroku create attendance-register
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

5. **Open**
   ```bash
   heroku open
   ```

**Cost:** $7/month for basic dyno

### 2D. Deploy to DigitalOcean (Full Control)

**Cost:** $6/month for basic droplet

1. **Create Droplet**
   - Ubuntu 22.04
   - Basic plan ($6/month)

2. **SSH into Server**
   ```bash
   ssh root@your-droplet-ip
   ```

3. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Install Nginx**
   ```bash
   sudo apt install nginx
   ```

5. **Clone Repository**
   ```bash
   cd /var/www
   git clone <your-repo>
   cd AttendanceRegister
   npm install
   npm run build
   ```

6. **Setup PM2**
   ```bash
   npm install -g pm2
   pm2 start dist/index.cjs
   pm2 startup
   pm2 save
   ```

7. **Configure Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/attendance
   ```

   Add:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

8. **Enable Site**
   ```bash
   sudo ln -s /etc/nginx/sites-available/attendance /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

9. **Setup SSL (Optional but Recommended)**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

## 🪟 Option 3: Windows Server Deployment

**Best for:** Organizations with Windows infrastructure

### Steps:

1. **Install Node.js on Windows Server**
   - Download from nodejs.org
   - Install with default settings

2. **Copy Project Files**
   - Place in `C:\inetpub\attendance`

3. **Install Dependencies**
   ```powershell
   cd C:\inetpub\attendance
   npm install --production
   npm run build
   ```

4. **Install Windows Service Wrapper**
   ```powershell
   npm install -g node-windows
   ```

5. **Create Service Script** (`service.js`):
   ```javascript
   const Service = require('node-windows').Service;

   const svc = new Service({
     name: 'Attendance Register',
     description: 'Attendance Management System',
     script: 'C:\\inetpub\\attendance\\dist\\index.cjs'
   });

   svc.on('install', () => {
     svc.start();
   });

   svc.install();
   ```

6. **Install Service**
   ```powershell
   node service.js
   ```

7. **Configure IIS (Optional)**
   - Install IIS with URL Rewrite and ARR
   - Create reverse proxy to Node.js app
   - Bind to port 80/443

---

## 🐧 Option 4: Linux Server Deployment (Ubuntu)

**Best for:** Production environments, cost-effective hosting

### Complete Setup:

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install Git
sudo apt install git -y

# 4. Create application directory
sudo mkdir -p /opt/attendance
sudo chown $USER:$USER /opt/attendance

# 5. Clone/Copy project
cd /opt/attendance
# Copy your files here

# 6. Install dependencies
npm install --production
npm run build

# 7. Install PM2
sudo npm install -g pm2

# 8. Start application
pm2 start dist/index.cjs --name attendance
pm2 startup systemd
pm2 save

# 9. Install Nginx
sudo apt install nginx -y

# 10. Configure Nginx (see DigitalOcean section above)

# 11. Setup firewall
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw enable
```

---

## 🐳 Option 5: Docker Deployment

**Best for:** Containerized environments, easy deployment

### Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --production

# Copy project files
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 5000

# Start application
CMD ["npm", "start"]
```

### Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  attendance:
    build: .
    ports:
      - "5000:5000"
    volumes:
      - ./data:/app/data
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

### Deploy:

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## 🔒 Security Hardening

### Essential Security Steps:

1. **Change Default Password**
   ```typescript
   // In server/index.ts or .env
   const ADMIN_PASSWORD = "YourStrongPassword123!";
   ```

2. **Enable HTTPS**
   - Use Let's Encrypt for free SSL
   - Or use Cloudflare for SSL proxy

3. **Set Strong Passwords**
   - Minimum 12 characters
   - Mix of letters, numbers, symbols

4. **Regular Backups**
   ```bash
   # Backup database
   cp sqlite.db backups/sqlite-$(date +%Y%m%d).db
   ```

5. **Update Dependencies**
   ```bash
   npm audit
   npm audit fix
   ```

6. **Firewall Rules**
   - Only allow necessary ports
   - Restrict admin access by IP if possible

7. **Rate Limiting**
   - Already implemented in code
   - Monitor for abuse

---

## 📊 Monitoring & Maintenance

### Using PM2 Dashboard:

```bash
# View status
pm2 status

# View logs
pm2 logs attendance

# Monitor resources
pm2 monit

# Restart
pm2 restart attendance

# Stop
pm2 stop attendance
```

### Setup Log Rotation:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Database Backup Script:

Create `backup.sh`:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/attendance"
mkdir -p $BACKUP_DIR
cp sqlite.db $BACKUP_DIR/sqlite_$DATE.db
# Keep only last 30 days
find $BACKUP_DIR -name "sqlite_*.db" -mtime +30 -delete
```

Schedule with cron:
```bash
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

---

## 🌐 Domain Setup (Optional)

### If you want a custom domain:

1. **Buy Domain**
   - Namecheap, GoDaddy, Google Domains
   - Example: `attendance.yourschool.com`

2. **Point to Server**
   - Add A record pointing to server IP
   - Or CNAME to cloud service URL

3. **Configure SSL**
   ```bash
   sudo certbot --nginx -d attendance.yourschool.com
   ```

---

## 📱 Mobile Access

### QR Code for Easy Access:

1. Generate QR code for your URL
2. Print and display in classrooms
3. Students scan to access instantly

### Progressive Web App (PWA):

Your app already supports PWA features:
- Add to home screen
- Works like native app
- Offline capability (limited)

---

## 💰 Cost Comparison

| Deployment Option | Initial Cost | Monthly Cost | Effort |
|-------------------|--------------|--------------|--------|
| Local Network | $0 | $0 | Low |
| Render (Free) | $0 | $0 | Very Low |
| Render (Paid) | $0 | $7 | Very Low |
| Railway | $0 | $5-20 | Very Low |
| Heroku | $0 | $7 | Low |
| DigitalOcean | $0 | $6 | Medium |
| AWS/Azure | $0 | $10-50 | High |
| Windows Server | $500+ | $0* | Medium |

*Assuming existing infrastructure

---

## 🎯 Recommended Deployment Strategy

### For Educational Institutions:

**Phase 1: Pilot (Week 1-2)**
- Deploy on local network
- Test with one class/department
- Gather feedback

**Phase 2: Expansion (Week 3-4)**
- Deploy to production server
- Roll out to all departments
- Train users

**Phase 3: Optimization (Month 2+)**
- Monitor performance
- Optimize based on usage
- Consider cloud backup

### For Small Organizations:

**Option 1: Start Local**
- Use existing computer as server
- $0 cost
- Upgrade later if needed

**Option 2: Cloud from Start**
- Use Render/Railway free tier
- Upgrade as you grow
- No hardware management

---

## ✅ Post-Deployment Checklist

After deployment:

- [ ] Test all features
- [ ] Verify database persistence
- [ ] Check real-time updates
- [ ] Test from multiple devices
- [ ] Verify exports work
- [ ] Test admin functions
- [ ] Check student portal
- [ ] Verify QR code access
- [ ] Test on mobile devices
- [ ] Setup monitoring
- [ ] Configure backups
- [ ] Document access URLs
- [ ] Train administrators
- [ ] Create user guides
- [ ] Setup support channel

---

## 🆘 Troubleshooting Deployment Issues

### Issue: Port already in use
```bash
# Find process using port 5000
netstat -ano | findstr :5000  # Windows
lsof -i :5000                 # Linux

# Kill process or change port
```

### Issue: Database permission errors
```bash
# Fix permissions
chmod 666 sqlite.db           # Linux
# Or run as administrator     # Windows
```

### Issue: Can't access from other devices
- Check firewall settings
- Verify server IP is correct
- Ensure devices on same network
- Check router settings

### Issue: WebSocket connection fails
- Verify WebSocket port is open
- Check for proxy/firewall blocking
- Ensure HTTPS for secure WebSocket

---

## 📚 Additional Resources

**Documentation:**
- Node.js Deployment: https://nodejs.org/en/docs/guides/
- PM2 Guide: https://pm2.keymetrics.io/docs/usage/quick-start/
- Nginx Config: https://nginx.org/en/docs/

**Community:**
- Stack Overflow
- Reddit r/node
- GitHub Discussions

---

## 🎉 You're Ready to Deploy!

Choose the deployment option that best fits your needs:

- **Quick & Free**: Render or Railway
- **Full Control**: DigitalOcean or local server
- **Enterprise**: Windows/Linux server with proper infrastructure

Need help? Refer to the specific section for your chosen deployment method!

---

**Last Updated**: January 18, 2026

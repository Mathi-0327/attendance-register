# Deployment Guide

## Production Build

The project has been built successfully! The production files are in the `dist/` directory.

## Running in Production

### Start the Production Server

```bash
npm start
```

This will:
- Start the Express server on port 5000 (or PORT environment variable)
- Serve the built React frontend
- Enable WebSocket connections for real-time updates

### Environment Variables

Set these environment variables if needed:

```bash
PORT=5000                    # Server port (default: 5000)
NODE_ENV=production          # Environment mode
```

## Deployment Options

### 1. Local Network Deployment

For local network access (as intended for this attendance system):

1. **Find your local IP address:**
   ```bash
   # Windows
   ipconfig
   
   # Look for IPv4 Address (e.g., 192.168.1.5)
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Access from other devices:**
   - Students: `http://YOUR_IP:5000/attendance`
   - Admin: `http://YOUR_IP:5000/admin` (password: `admin123`)

### 2. Cloud Deployment (VPS/Cloud Server)

#### Option A: Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start dist/index.cjs --name attendance-register

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system reboot
pm2 startup
```

#### Option B: Using systemd (Linux)

Create `/etc/systemd/system/attendance-register.service`:

```ini
[Unit]
Description=Attendance Register Server
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/AttendanceRegister
Environment="NODE_ENV=production"
Environment="PORT=5000"
ExecStart=/usr/bin/node dist/index.cjs
Restart=always

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable attendance-register
sudo systemctl start attendance-register
```

### 3. Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy built files
COPY dist/ ./dist/

EXPOSE 5000

CMD ["node", "dist/index.cjs"]
```

Build and run:
```bash
docker build -t attendance-register .
docker run -p 5000:5000 attendance-register
```

## Important Notes

1. **Network Access**: The system validates that clients are on the same network as the server. This is by design for security.

2. **Admin Password**: Default password is `admin123`. Change it in `client/src/context/SystemContext.tsx` (ADMIN_PASSWORD constant) before deploying.

3. **Data Persistence**: Currently uses in-memory storage. For production, consider:
   - Adding a database (PostgreSQL, MySQL, etc.)
   - Implementing persistent storage
   - Regular backups

4. **HTTPS**: For production, use HTTPS with a reverse proxy (nginx, Caddy) or SSL certificate.

5. **Firewall**: Ensure port 5000 (or your chosen port) is open in your firewall.

## Troubleshooting

- **Port already in use**: Change the PORT environment variable
- **Network access denied**: Ensure clients are on the same network subnet
- **WebSocket not working**: Check firewall settings for WebSocket connections

## Build Output

- **Client**: `dist/public/` - Static React files
- **Server**: `dist/index.cjs` - Bundled Node.js server


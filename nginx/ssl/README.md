# SSL Certificates

Place your SSL certificates here:

- `cert.pem` - SSL certificate (full chain)
- `key.pem` - SSL private key

## Generating Self-Signed Certificates (Development Only)

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout key.pem -out cert.pem \
  -subj "/C=NO/ST=Oslo/L=Oslo/O=RosterSaaS/CN=localhost"
```

## Using Let's Encrypt (Production)

```bash
# Install certbot
apt-get install certbot python3-certbot-nginx

# Obtain certificate
certbot certonly --webroot -w /var/www/certbot \
  -d yourdomain.com -d www.yourdomain.com

# Certificates will be at:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem -> cert.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem -> key.pem

# Copy or symlink certificates
ln -s /etc/letsencrypt/live/yourdomain.com/fullchain.pem cert.pem
ln -s /etc/letsencrypt/live/yourdomain.com/privkey.pem key.pem
```

## Auto-Renewal

Add to crontab:
```
0 12 * * * /usr/bin/certbot renew --quiet
```

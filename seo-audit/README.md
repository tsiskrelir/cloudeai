# SEO Audit - Next.js

A comprehensive SEO auditing tool for web pages with 50+ automated checks, built on Next.js.

## Features

- ✅ Title, meta description, and H1–H6 validation
- ✅ Image `alt` text and accessibility checks
- ✅ Internal/external/broken link analysis
- ✅ Schema.org validation
- ✅ Open Graph & Twitter Cards
- ✅ Accessibility checks (ARIA, landmarks, contrast)
- ✅ CMS & framework detection
- ✅ JSON/CSV export
- ✅ Robots.txt, sitemap, and llms.txt checks

---

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the UI.

---

## Production Build

```bash
npm run build
npm start
```

---

## Server Installation (Example)

### 1. Upload files

```bash
sudo mkdir -p /var/www/seo-audit
scp -r ./* user@server:/var/www/seo-audit/
```

### 2. Install dependencies

```bash
cd /var/www/seo-audit
npm install
```

### 3. Build

```bash
npm run build
```

### 4. Run with PM2

```bash
sudo npm install -g pm2
pm2 start npm --name "seo-audit" -- start
pm2 save
pm2 startup
```

### 5. Apache proxy example

Create `/etc/apache2/sites-available/seo-audit.conf`:

```apache
<VirtualHost *:80>
    ServerName seo.yourdomain.com

    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/

    ErrorLog ${APACHE_LOG_DIR}/seo-audit-error.log
    CustomLog ${APACHE_LOG_DIR}/seo-audit-access.log combined
</VirtualHost>
```

Enable Apache modules and the site:

```bash
sudo a2enmod proxy proxy_http
sudo a2ensite seo-audit
sudo systemctl restart apache2
```

---

## HTTPS (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-apache
sudo certbot --apache -d seo.yourdomain.com
```

---

## Project Structure

```
/var/www/seo-audit/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── seochecker/
│   │   └── page.tsx          # Main UI
│   └── api/
│       └── audit/
│           └── route.ts      # API endpoint
├── lib/
│   ├── audit/
│   │   ├── runAudit.ts       # Audit logic
│   │   └── types.ts          # TypeScript types
│   ├── checks/
│   │   └── patterns.ts       # CMS/Framework patterns
│   └── fetch/
│       └── fetchHtml.ts      # HTML fetch + helpers
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
└── postcss.config.js
```

---

## API Usage

### POST /api/audit

```bash
# Audit by URL
curl -X POST http://localhost:3000/api/audit \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Audit by raw HTML
curl -X POST http://localhost:3000/api/audit \
  -H "Content-Type: application/json" \
  -d '{"html": "<!DOCTYPE html>..."}'
```

---

## Useful Commands

```bash
pm2 status
pm2 logs seo-audit
pm2 restart seo-audit
pm2 stop seo-audit
```

---

## Troubleshooting

### "Cannot find module 'jsdom'"
```bash
npm install jsdom @types/jsdom
```

### Port 3000 is in use
```bash
# Change port in package.json
"start": "next start -p 3001"
```

### Apache proxy not working
```bash
sudo a2enmod proxy proxy_http
sudo systemctl restart apache2
```

---

## License

MIT

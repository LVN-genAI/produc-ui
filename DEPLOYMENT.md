# Deploying to AWS (Free Tier)

This guide covers deploying the **product-ui** Next.js app to AWS on a free
account. Two paths are documented:

- **Option A — AWS Amplify Hosting** ✅ *recommended*: easiest, native Next.js
  SSR support, automatic HTTPS + CI/CD from Git.
- **Option B — EC2 `t2.micro`**: the classic 12-month free-tier VM; full
  control, more manual (Node + PM2 + Nginx + Certbot).

> ⚠️ **This app requires a Node/SSR server — you cannot use `next export` / S3
> static hosting.** It relies on Server Actions, the cookie-based Supabase
> server client, React Server Components, and `proxy.ts`. Both options below run
> a real Next.js server.

---

## 0. Prerequisites (do these once, for either option)

1. **An AWS account** (free tier).
2. **Your Supabase values** — from Supabase → Project Settings → API:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://ebjkrglhievywdclhcwk.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your **anon / publishable** key
     (the `sb_publishable_…` value — **never** the `service_role` key).
3. **The database is set up** — you have run [`SUPABASE_SCHEMA.sql`](SUPABASE_SCHEMA.sql)
   and created at least one admin user.
4. **Code pushed to GitHub/GitLab/Bitbucket** (required for Amplify; convenient
   for EC2):
   ```bash
   git add -A
   git commit -m "Prepare for deployment"
   git branch -M main
   git remote add origin https://github.com/<you>/product-ui.git
   git push -u origin main
   ```

### Environment variables (required at BUILD time)

Because these are `NEXT_PUBLIC_*`, Next.js **inlines them during `next build`**,
and [`lib/supabase/env.ts`](lib/supabase/env.ts) throws if they are missing.
**They must be set before/at build time**, not just at runtime:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ebjkrglhievywdclhcwk.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your `sb_publishable_…` key |

---

## Option A — AWS Amplify Hosting (recommended)

Amplify detects Next.js and runs it in SSR (compute) mode automatically.

### A1. Start a new app
1. Open the **AWS Amplify** console → **Create new app** → **Host web app**.
2. Choose your Git provider, authorize, and select the **`product-ui`** repo and
   the **`main`** branch.

### A2. Build settings
Amplify auto-generates a Next.js build spec. Confirm it looks like this
(or commit the file below as `amplify.yml` in the repo root):

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

### A3. Environment variables
In the Amplify app → **Hosting → Environment variables**, add both:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> These must exist **before the first build**, or the build fails with
> "Missing env var …". If it already failed, add them then **Redeploy**.

### A4. Deploy
Click **Save and deploy**. Amplify installs, builds, and hosts the app. When
it finishes you get a URL like `https://main.d1234abcd.amplifyapp.com`.

### A5. Finish (Supabase + optional domain)
- In **Supabase → Authentication → URL Configuration**, set the **Site URL** to
  your Amplify URL (and add it to **Redirect URLs**).
- (Optional) **Custom domain**: Amplify → **Domain management** → add your
  domain; Amplify provisions free HTTPS automatically.

**Every `git push` to `main` now auto-redeploys.** Done. ✅

### Amplify free-tier notes
- Build: ~1,000 free build-minutes/month.
- Hosting/serving and SSR requests have monthly free allowances.
- Always check the current [Amplify pricing](https://aws.amazon.com/amplify/pricing/)
  — free allowances change and heavy traffic can incur cost.

---

## Option B — EC2 `t2.micro` (12-month free tier)

Full control on a tiny VM. You run `next start` behind Nginx with a free TLS
certificate. Requires a **domain name** for HTTPS (Certbot needs one).

### B1. Launch the instance
1. **EC2 console → Launch instance.**
2. **AMI:** Ubuntu Server 24.04 LTS (free-tier eligible).
3. **Type:** `t2.micro` (or `t3.micro` where that's the free option).
4. **Key pair:** create/download one (for SSH).
5. **Security group** — allow inbound:
   - SSH `22` (your IP only),
   - HTTP `80` (anywhere),
   - HTTPS `443` (anywhere).
6. Launch, then note the **public IP / DNS**.

> `t2.micro` has only ~1 GB RAM. `next build` can run out of memory. If the
> build is killed, add swap first:
> ```bash
> sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
> sudo mkswap /swapfile && sudo swapon /swapfile
> echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
> ```

### B2. Connect and install Node 20 LTS
```bash
ssh -i your-key.pem ubuntu@<PUBLIC_IP>

# Node 20 LTS (Next 16 needs Node >= 20.9)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git nginx
node -v   # should print v20.x
```

### B3. Get the code and configure env
```bash
git clone https://github.com/<you>/product-ui.git
cd product-ui

# Runtime + build-time env (NEXT_PUBLIC_* are read during build)
cat > .env.local <<'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://ebjkrglhievywdclhcwk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_your_real_key_here
EOF
```

### B4. Install, build, and run with PM2
```bash
npm ci
npm run build

sudo npm install -g pm2
pm2 start npm --name product-ui -- start   # runs `next start` on port 3000
pm2 save
pm2 startup systemd    # run the command it prints, to auto-start on reboot
```
The app is now live on `http://<PUBLIC_IP>:3000` (internal). Next: put Nginx in
front on port 80/443.

### B5. Nginx reverse proxy
```bash
sudo tee /etc/nginx/sites-available/product-ui >/dev/null <<'EOF'
server {
    listen 80;
    server_name your-domain.com;   # or the EC2 public DNS for HTTP-only testing

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
EOF

sudo ln -s /etc/nginx/sites-available/product-ui /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### B6. Free HTTPS with Certbot (needs a domain pointing at the IP)
Point your domain's `A` record at the EC2 public IP, then:
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```
Certbot installs the cert and sets up auto-renewal.

### B7. Finish (Supabase)
- **Supabase → Authentication → URL Configuration:** set **Site URL** to
  `https://your-domain.com` and add it to **Redirect URLs**.

### B8. Redeploying updates
```bash
cd ~/product-ui
git pull
npm ci
npm run build
pm2 restart product-ui
```

### EC2 free-tier notes
- Free tier: 750 hours/month of `t2.micro` for **12 months** (one instance
  running 24/7 fits). After 12 months it starts billing.
- 30 GB EBS storage and limited data transfer are included.

---

## Post-deploy checklist (either option)

- [ ] `https://<your-url>/` loads the landing page.
- [ ] `/catalog` renders the storefront (public, no login).
- [ ] `/login` works; signing in redirects to `/admin`.
- [ ] `/admin` is blocked when logged out (redirects to `/login`).
- [ ] Creating a category / product works (writes hit Supabase).
- [ ] Image and `.glb` uploads succeed (Storage RLS + bucket exist).
- [ ] Opening a product with a 3D model loads the `<model-viewer>`.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Build fails: *"Missing env var NEXT_PUBLIC_SUPABASE_ANON_KEY"* | Set both env vars **before** building (Amplify env vars / EC2 `.env.local`), then rebuild. |
| Build killed / out of memory on EC2 | Add the 2 GB swap file (step B1). |
| *"Could not find the table 'public.categories'"* | Run [`SUPABASE_SCHEMA.sql`](SUPABASE_SCHEMA.sql) in the Supabase SQL Editor. |
| Uploads fail with a policy/bucket error | Re-run the storage section of `SUPABASE_SCHEMA.sql` (creates `catalog-assets` + policies). |
| Login says *"Invalid login credentials"* | Create an admin user in Supabase → Authentication → Users (enable **Auto Confirm**). |
| Node version error on build | Use Node **20 LTS** (`node -v` ≥ 20.9). |

---

### Which should I pick?

- **Just want it live with the least effort → Option A (Amplify).** Push to Git,
  set two env vars, click deploy. HTTPS and CI/CD are automatic.
- **Want a hands-on server / classic free tier → Option B (EC2).** More steps,
  but you control the box; needs a domain for HTTPS.

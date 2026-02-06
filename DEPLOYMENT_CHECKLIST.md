# Deployment Checklist for dysumcorp.pro

## 1. OAuth Provider Configuration

### Google OAuth
Add these authorized redirect URIs in Google Cloud Console:
- `https://dysumcorp.pro/api/auth/callback/google`
- `https://www.dysumcorp.pro/api/auth/callback/google` (if using www)

### Dropbox OAuth
Add these redirect URIs in Dropbox App Console:
- `https://dysumcorp.pro/api/auth/callback/dropbox`
- `https://www.dysumcorp.pro/api/auth/callback/dropbox` (if using www)

## 2. Environment Variables

Copy `.env.production` to your hosting platform and update:
- ✅ `BETTER_AUTH_URL` → `https://dysumcorp.pro`
- ✅ `NEXT_PUBLIC_BETTER_AUTH_URL` → `https://dysumcorp.pro`
- ⚠️ `CREEM_API_KEY` → Replace with production key from Creem dashboard
- ⚠️ `CREEM_WEBHOOK_SECRET` → Replace with production webhook secret

## 3. Creem Billing Setup

1. Get production API keys from Creem dashboard
2. Update webhook URL to: `https://dysumcorp.pro/api/creem/webhook`
3. Set `testMode: false` in `lib/auth.ts` for production

## 4. Domain Configuration

Ensure your hosting platform is configured for:
- Primary domain: `dysumcorp.pro`
- SSL certificate (automatic with most platforms)
- Optional: www redirect (`www.dysumcorp.pro` → `dysumcorp.pro`)

## 5. Database

Your Neon PostgreSQL database is already configured and will work in production.

## 6. Build & Deploy

```bash
pnpm build
pnpm start
```

Or deploy to your platform (Vercel, Netlify, etc.)

## 7. Post-Deployment Testing

- [ ] Test Google OAuth login
- [ ] Test Dropbox OAuth login
- [ ] Test billing flow with Creem
- [ ] Verify webhook endpoint is accessible
- [ ] Check all dashboard pages load correctly

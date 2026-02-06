# Preview Deployment Guide

## Quick Start

This guide will help you deploy your app to a preview environment (Vercel, Netlify, Railway, etc.)

## Pre-Deployment Checklist

### ✅ Completed
- [x] Database configured (Neon PostgreSQL)
- [x] Prisma schema set up
- [x] Better Auth configured
- [x] OAuth providers integrated (Google, Dropbox)
- [x] Creem billing integrated
- [x] Environment variables documented

### 🔧 Required Before Deployment

1. **Update OAuth Redirect URIs**
   - Add your preview URL to Google OAuth settings
   - Add your preview URL to Dropbox OAuth settings

2. **Set Environment Variables**
   - Copy all variables from `.env.example`
   - Use your actual values (never commit `.env` files!)

3. **Production Settings**
   - Update `testMode: false` in `lib/auth.ts` for production billing
   - Use production Creem API keys

## Platform-Specific Instructions

### Vercel (Recommended)

1. **Install Vercel CLI** (optional)
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Set Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.example`
   - Make sure to add them for Production, Preview, and Development

4. **Update OAuth Providers**
   - Google: Add `https://your-app.vercel.app/api/auth/callback/google`
   - Dropbox: Add `https://your-app.vercel.app/api/auth/callback/dropbox`

5. **Update Creem Webhook**
   - Set webhook URL to: `https://your-app.vercel.app/api/creem/webhook`

### Netlify

1. **Deploy via Git**
   - Connect your repository
   - Build command: `pnpm build`
   - Publish directory: `.next`

2. **Environment Variables**
   - Go to Site Settings → Environment Variables
   - Add all variables from `.env.example`

3. **Update OAuth & Webhook URLs** (same as Vercel)

### Railway

1. **Deploy**
   - Connect your GitHub repository
   - Railway will auto-detect Next.js

2. **Environment Variables**
   - Add all variables in the Variables tab

3. **Update OAuth & Webhook URLs** (same as Vercel)

## Environment Variables Reference

Required for all deployments:

```
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=your-secret
BETTER_AUTH_URL=https://your-preview-url.com
NEXT_PUBLIC_BETTER_AUTH_URL=https://your-preview-url.com
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
DROPBOX_CLIENT_ID=...
DROPBOX_CLIENT_SECRET=...
CREEM_API_KEY=...
CREEM_WEBHOOK_SECRET=...
```

## Post-Deployment Testing

1. **Test Authentication**
   - [ ] Google OAuth login works
   - [ ] Dropbox OAuth login works
   - [ ] Session persistence works

2. **Test Billing**
   - [ ] Billing page loads
   - [ ] Can initiate checkout
   - [ ] Webhook receives events
   - [ ] Subscription status updates

3. **Test Dashboard**
   - [ ] All pages load correctly
   - [ ] Protected routes work
   - [ ] User menu functions

## Troubleshooting

### OAuth Errors
- Verify redirect URIs match exactly (including https://)
- Check that client IDs and secrets are correct
- Ensure no trailing slashes in URLs

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check that Neon database allows connections from your host
- Ensure SSL mode is enabled

### Build Failures
- Check that `prisma generate` runs successfully
- Verify all dependencies are in `package.json`
- Check Node.js version compatibility (18+)

### Webhook Issues
- Verify webhook URL is publicly accessible
- Check webhook secret matches Creem dashboard
- Review webhook logs in Creem dashboard

## Security Notes

- ✅ `.env` files are gitignored
- ✅ Use different secrets for preview vs production
- ✅ Rotate secrets regularly
- ✅ Use test mode for Creem in preview environments
- ⚠️ Never commit sensitive credentials

## Need Help?

- Check deployment logs in your platform dashboard
- Review Next.js deployment docs: https://nextjs.org/docs/deployment
- Check Better Auth docs: https://better-auth.com
- Review Creem docs: https://docs.creem.io

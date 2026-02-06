# 🚀 Deploy Now - Quick Guide

## Option 1: Deploy to Vercel (Fastest)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Prepare for deployment"
git push
```

### Step 2: Deploy
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings

### Step 3: Add Environment Variables
In Vercel dashboard, go to Settings → Environment Variables and add all variables from your `.env` file:

```
DATABASE_URL=<your-database-url>
BETTER_AUTH_SECRET=<your-secret>
BETTER_AUTH_URL=https://your-app.vercel.app
NEXT_PUBLIC_BETTER_AUTH_URL=https://your-app.vercel.app
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
DROPBOX_CLIENT_ID=<your-dropbox-client-id>
DROPBOX_CLIENT_SECRET=<your-dropbox-client-secret>
CREEM_API_KEY=<your-creem-api-key>
CREEM_WEBHOOK_SECRET=<your-creem-webhook-secret>
```

**Important:** 
- Copy the actual values from your local `.env` file
- Replace `your-app.vercel.app` with your actual Vercel URL after deployment

### Step 4: Update OAuth Redirect URIs

#### Google OAuth Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find your OAuth 2.0 Client ID
3. Add authorized redirect URI:
   - `https://your-app.vercel.app/api/auth/callback/google`

#### Dropbox App Console
1. Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Select your app
3. Add redirect URI:
   - `https://your-app.vercel.app/api/auth/callback/dropbox`

### Step 5: Update Creem Webhook
1. Go to [Creem Dashboard](https://creem.io/dashboard)
2. Update webhook URL to:
   - `https://your-app.vercel.app/api/creem/webhook`

### Step 6: Redeploy
After updating environment variables, trigger a new deployment in Vercel.

---

## Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts and set environment variables when asked
```

---

## Option 3: Deploy to Netlify

### Step 1: Push to GitHub (same as above)

### Step 2: Deploy
1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub and select your repository

### Step 3: Configure Build Settings
- Build command: `pnpm build`
- Publish directory: `.next`

### Step 4: Add Environment Variables
Same as Vercel, but in Netlify dashboard under Site Settings → Environment Variables

### Step 5: Update OAuth & Webhook URLs
Same process as Vercel, but use your Netlify URL

---

## Pre-Deployment Checklist

- [ ] Code is committed to Git
- [ ] `.env` files are NOT committed (check `.gitignore`)
- [ ] Database is accessible from the internet
- [ ] All dependencies are in `package.json`
- [ ] Build works locally: `pnpm build`

## Post-Deployment Checklist

- [ ] Update `BETTER_AUTH_URL` environment variable with actual deployment URL
- [ ] Update `NEXT_PUBLIC_BETTER_AUTH_URL` with actual deployment URL
- [ ] Add OAuth redirect URIs for Google
- [ ] Add OAuth redirect URIs for Dropbox
- [ ] Update Creem webhook URL
- [ ] Redeploy after environment variable changes
- [ ] Test Google login
- [ ] Test Dropbox login
- [ ] Test billing flow
- [ ] Check all dashboard pages

## Troubleshooting

### Build Fails
```bash
# Test build locally first
pnpm install
pnpm build
```

### OAuth Errors
- Make sure redirect URIs match EXACTLY (no trailing slashes)
- Verify client IDs and secrets are correct
- Check that URLs use `https://` in production

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check Neon database allows connections from your host
- Ensure connection string includes `sslmode=require`

### Environment Variables Not Working
- Make sure to redeploy after adding/changing variables
- Check variable names match exactly (case-sensitive)
- Verify `NEXT_PUBLIC_` prefix for client-side variables

## Need Help?

Check the detailed guide: `PREVIEW_DEPLOYMENT.md`

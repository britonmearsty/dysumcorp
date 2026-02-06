# OAuth Setup Checklist

## ✅ What's Already Configured

1. **Prisma Client** - Now properly initialized with PostgreSQL adapter
2. **Better Auth** - Configured with Google and Dropbox OAuth providers
3. **Auth Page** - Updated with OAuth sign-in buttons
4. **Environment Variables** - Placeholders added to `.env`
5. **Package.json** - Added `"type": "module"` to fix module warnings

## 🔧 What You Need to Do

### Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API** (or Google Identity)
4. Navigate to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add Authorized redirect URI:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
7. Copy the **Client ID** and **Client Secret**

### Step 2: Get Dropbox OAuth Credentials

1. Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Click **Create app**
3. Choose:
   - **Scoped access**
   - **Full Dropbox** access
4. Name your app
5. In app settings, add Redirect URI:
   ```
   http://localhost:3000/api/auth/callback/dropbox
   ```
6. Copy the **App key** and **App secret**

### Step 3: Update Environment Variables

Edit your `.env` file and replace the placeholder values:

```env
# Replace these with your actual credentials:
GOOGLE_CLIENT_ID="your-actual-google-client-id"
GOOGLE_CLIENT_SECRET="your-actual-google-client-secret"

DROPBOX_CLIENT_ID="your-actual-dropbox-app-key"
DROPBOX_CLIENT_SECRET="your-actual-dropbox-app-secret"
```

### Step 4: Test the Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Visit: `http://localhost:3000/auth`

3. Click **Continue with Google** or **Continue with Dropbox**

4. You should be redirected to the OAuth provider

5. After authorization, you'll be redirected back and signed in

## 🔍 Troubleshooting

### If you see "Invalid redirect URI"
- Make sure the redirect URI in your OAuth app matches exactly:
  - Google: `http://localhost:3000/api/auth/callback/google`
  - Dropbox: `http://localhost:3000/api/auth/callback/dropbox`

### If you see "Client ID not found"
- Double-check your `.env` file has the correct credentials
- Restart the dev server after updating `.env`

### If OAuth flow doesn't start
- Check browser console for errors
- Verify environment variables are loaded (check server logs)

## 📝 Production Deployment

When deploying to production:

1. Update these environment variables to use your production domain:
   ```env
   BETTER_AUTH_URL="https://yourdomain.com"
   NEXT_PUBLIC_BETTER_AUTH_URL="https://yourdomain.com"
   ```

2. Add production redirect URIs in OAuth consoles:
   - Google: `https://yourdomain.com/api/auth/callback/google`
   - Dropbox: `https://yourdomain.com/api/auth/callback/dropbox`

3. Set all environment variables in your hosting platform

## 🎯 Testing OAuth Flow

Once configured, the OAuth flow works like this:

1. User clicks "Continue with Google/Dropbox"
2. User is redirected to OAuth provider
3. User authorizes your app
4. Provider redirects back to your app with auth code
5. Better Auth exchanges code for tokens
6. User account is created/updated in database
7. User is signed in and redirected to home page

## 📚 Additional Resources

- [Better Auth Documentation](https://www.better-auth.com/docs)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [Dropbox OAuth Guide](https://www.dropbox.com/developers/documentation/http/documentation)

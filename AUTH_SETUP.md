# Authentication Setup with Better Auth & Prisma

## What's Been Configured

✅ Better Auth with Google and Dropbox OAuth
✅ Prisma schema with User, Session, Account, and Verification models
✅ Database migrations applied
✅ API routes at `/api/auth/*`
✅ Auth client for frontend
✅ OAuth login page at `/auth`
✅ User menu component in navbar

## How to Use

### 1. Set up OAuth credentials

#### Google OAuth Setup (with Drive Access)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Google+ API
   - Google Drive API
4. Configure OAuth consent screen and add scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `.../auth/drive.file`
   - `.../auth/drive.appdata`
5. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
6. Set application type to "Web application"
7. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
8. Copy the Client ID and Client Secret to your `.env` file

**Note:** Users will be asked to grant permissions to read/write files in Google Drive.

#### Dropbox OAuth Setup (with File Access)
1. Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Click "Create app"
3. Choose "Scoped access" and "Full Dropbox" access
4. Name your app
5. In the **Permissions** tab, enable these scopes:
   - `account_info.read`
   - `files.metadata.write`
   - `files.metadata.read`
   - `files.content.write`
   - `files.content.read`
6. Click **Submit** to save permissions
7. In app settings, add redirect URI: `http://localhost:3000/api/auth/callback/dropbox`
8. Copy the App key and App secret to your `.env` file

**Note:** Users will be asked to grant permissions to read/write files in Dropbox.

### 2. Configure environment variables

Update your `.env` file with the OAuth credentials:
```
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
DROPBOX_CLIENT_ID="your-dropbox-app-key"
DROPBOX_CLIENT_SECRET="your-dropbox-app-secret"
```

### 3. Start the development server
```bash
npm run dev
```

### 4. Sign in with OAuth
1. Navigate to `http://localhost:3000/auth`
2. Click "Continue with Google" or "Continue with Dropbox"
3. Authorize the application
4. You'll be redirected back and signed in

### 5. Sign out
- Click the "Sign Out" button in the navbar

## Environment Variables

Required variables in your `.env` file:
```
DATABASE_URL="your-postgres-connection-string"
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Dropbox OAuth
DROPBOX_CLIENT_ID="your-dropbox-app-key"
DROPBOX_CLIENT_SECRET="your-dropbox-app-secret"
```

## Files Created/Modified

### Core Auth Files
- `lib/auth.ts` - Better Auth server configuration with OAuth providers
- `lib/auth-client.ts` - Better Auth client for React
- `lib/auth-server.ts` - Server-side session utilities
- `app/api/auth/[...all]/route.ts` - API routes handler

### UI Components
- `app/auth/page.tsx` - OAuth login page
- `components/user-menu.tsx` - User menu component
- `components/navbar.tsx` - Updated with user menu

### Protected Pages (Examples)
- `app/dashboard/page.tsx` - Client-side protected route
- `app/profile/page.tsx` - Server-side protected route
- `middleware.ts` - Route protection middleware

### Database
- `prisma/schema.prisma` - Database schema with auth models
- `prisma/migrations/` - Database migrations

## Protected Routes

### Client-Side Protection
See `app/dashboard/page.tsx` for an example using `useSession()` hook.

### Server-Side Protection
See `app/profile/page.tsx` for an example using `getSession()` function.

### Middleware Protection
The `middleware.ts` file automatically redirects unauthenticated users from protected routes.

## API Usage

### Client-Side
```typescript
import { signIn, signOut, useSession } from "@/lib/auth-client";

// Sign in with Google
await signIn.social({ provider: "google", callbackURL: "/" });

// Sign in with Dropbox
await signIn.social({ provider: "dropbox", callbackURL: "/" });

// Sign out
await signOut();

// Get session
const { data: session } = useSession();
```

### Server-Side
```typescript
import { getSession, requireAuth } from "@/lib/auth-server";

// Get session (returns null if not authenticated)
const session = await getSession();

// Require authentication (throws error if not authenticated)
const session = await requireAuth();
```

## Production Deployment

When deploying to production:
1. Update `BETTER_AUTH_URL` and `NEXT_PUBLIC_BETTER_AUTH_URL` to your production domain
2. Update OAuth redirect URIs in Google Cloud Console and Dropbox App Console to use your production domain
3. Ensure all environment variables are set in your hosting platform

## Next Steps

You can extend this setup by:
- Adding more OAuth providers (GitHub, Facebook, etc.)
- Implementing email verification
- Adding two-factor authentication
- Adding role-based access control
- Customizing the auth UI

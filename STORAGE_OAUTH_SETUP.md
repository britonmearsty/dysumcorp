# Storage OAuth Setup Guide

## Overview

This guide explains how to configure Google Drive and Dropbox OAuth with the necessary permissions to read and write files to these cloud storage services.

## Permissions Configured

### Google Drive Scopes
- `openid` - Basic authentication
- `email` - User email access
- `profile` - User profile information
- `https://www.googleapis.com/auth/drive.file` - Access to files created by the app
- `https://www.googleapis.com/auth/drive.appdata` - Access to app-specific data folder

### Dropbox Scopes
- `account_info.read` - Read user account information
- `files.metadata.write` - Write file metadata
- `files.metadata.read` - Read file metadata
- `files.content.write` - Write file contents
- `files.content.read` - Read file contents

## Google Drive Setup

### 1. Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Library**
4. Enable the following APIs:
   - Google Drive API
   - Google+ API (for profile info)

### 2. Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type (or Internal if using Google Workspace)
3. Fill in the required information:
   - App name
   - User support email
   - Developer contact email
4. Add the following scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `.../auth/drive.file`
   - `.../auth/drive.appdata`
5. Add test users (if in testing mode)
6. Save and continue

### 3. Create OAuth Client ID

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Select **Web application**
4. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
5. Copy the **Client ID** and **Client Secret**
6. Add them to your `.env` file:
   ```
   GOOGLE_CLIENT_ID="your-client-id"
   GOOGLE_CLIENT_SECRET="your-client-secret"
   ```

### 4. Verify Scopes

After users authenticate, they will see a consent screen requesting:
- View your email address
- View your basic profile info
- See, create, and delete files created by this app in Google Drive
- View and manage app-specific data in your Google Drive

## Dropbox Setup

### 1. Create a Dropbox App

1. Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Click **Create app**
3. Choose:
   - **Scoped access** (recommended)
   - **Full Dropbox** or **App folder** (depending on your needs)
   - Give your app a name

### 2. Configure Permissions

1. In your app settings, go to the **Permissions** tab
2. Enable the following scopes:

   **Individual scopes:**
   - `account_info.read` - View basic information about user's account
   
   **Files and folders:**
   - `files.metadata.write` - Edit file and folder metadata
   - `files.metadata.read` - View file and folder metadata
   - `files.content.write` - Edit content of files and folders
   - `files.content.read` - View content of files and folders

3. Click **Submit** to save the permissions

### 3. Configure OAuth Redirect URIs

1. In the **Settings** tab, find **Redirect URIs**
2. Add your redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/dropbox`
   - Production: `https://yourdomain.com/api/auth/callback/dropbox`
3. Save the changes

### 4. Get Credentials

1. In the **Settings** tab, find:
   - **App key** (this is your Client ID)
   - **App secret** (this is your Client Secret)
2. Add them to your `.env` file:
   ```
   DROPBOX_CLIENT_ID="your-app-key"
   DROPBOX_CLIENT_SECRET="your-app-secret"
   ```

## Environment Variables

Your `.env` file should include:

```env
# Google OAuth with Drive access
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Dropbox OAuth with file access
DROPBOX_CLIENT_ID="your-dropbox-app-key"
DROPBOX_CLIENT_SECRET="your-dropbox-app-secret"
```

## Testing the Integration

### 1. Start your development server
```bash
npm run dev
```

### 2. Navigate to the auth page
```
http://localhost:3000/auth
```

### 3. Sign in with Google or Dropbox

When users authenticate, they will be prompted to grant the requested permissions.

### 4. Verify access tokens

After authentication, the OAuth tokens (including access and refresh tokens) are stored in the database in the `Account` table. These tokens can be used to make API calls to Google Drive or Dropbox.

## Using the Access Tokens

### Retrieving Tokens from Database

```typescript
import { prisma } from "@/lib/prisma";

// Get user's Google Drive token
const googleAccount = await prisma.account.findFirst({
  where: {
    userId: session.user.id,
    providerId: "google",
  },
});

const accessToken = googleAccount?.accessToken;
const refreshToken = googleAccount?.refreshToken;

// Get user's Dropbox token
const dropboxAccount = await prisma.account.findFirst({
  where: {
    userId: session.user.id,
    providerId: "dropbox",
  },
});
```

### Making API Calls

#### Google Drive Example
```typescript
// Upload a file to Google Drive
const response = await fetch(
  "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "multipart/related",
    },
    body: formData,
  }
);
```

#### Dropbox Example
```typescript
// Upload a file to Dropbox
const response = await fetch(
  "https://content.dropboxapi.com/2/files/upload",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Dropbox-API-Arg": JSON.stringify({
        path: "/test.txt",
        mode: "add",
        autorename: true,
      }),
      "Content-Type": "application/octet-stream",
    },
    body: fileContent,
  }
);
```

## Token Refresh

OAuth tokens expire after a certain period. Better Auth handles token refresh automatically, but you may need to implement manual refresh logic for long-running operations.

### Google Token Refresh
```typescript
const response = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  }),
});
```

### Dropbox Token Refresh
```typescript
const response = await fetch("https://api.dropboxapi.com/oauth2/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    client_id: process.env.DROPBOX_CLIENT_ID!,
    client_secret: process.env.DROPBOX_CLIENT_SECRET!,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  }),
});
```

## Security Best Practices

1. **Never expose tokens to the client** - Always make API calls from server-side code
2. **Use HTTPS in production** - OAuth requires secure connections
3. **Implement proper error handling** - Handle token expiration and refresh failures
4. **Limit scope requests** - Only request the permissions you actually need
5. **Store tokens securely** - The database stores encrypted tokens
6. **Implement rate limiting** - Respect API rate limits for both services

## Troubleshooting

### Google Drive Issues

**Error: "Access blocked: This app's request is invalid"**
- Ensure you've enabled the Google Drive API in Google Cloud Console
- Verify the redirect URI matches exactly (including http/https)
- Check that all required scopes are added to the OAuth consent screen

**Error: "Invalid scope"**
- Make sure the scopes in your code match those configured in Google Cloud Console
- Scopes must be space-separated in the OAuth request

### Dropbox Issues

**Error: "Invalid redirect_uri"**
- Verify the redirect URI in Dropbox App Console matches your callback URL exactly
- Check for trailing slashes or protocol mismatches

**Error: "Invalid scope"**
- Ensure you've submitted the permission changes in the Dropbox App Console
- Some scopes require app approval from Dropbox

## Next Steps

1. Create API routes for file operations (upload, download, list, delete)
2. Implement a file manager UI component
3. Add error handling and retry logic for API calls
4. Implement file sync functionality
5. Add progress indicators for file uploads/downloads

## Resources

- [Google Drive API Documentation](https://developers.google.com/drive/api/guides/about-sdk)
- [Dropbox API Documentation](https://www.dropbox.com/developers/documentation/http/documentation)
- [Better Auth Documentation](https://www.better-auth.com/docs)

# Storage Integration Quick Start

## What's Been Added

✅ Google Drive and Dropbox OAuth with file access permissions
✅ Storage API utilities for file operations
✅ API routes for upload and list operations
✅ Example React component for file uploads
✅ Automatic token refresh handling

## Files Created

- `lib/storage-api.ts` - Storage API utilities
- `app/api/storage/upload/route.ts` - File upload endpoint
- `app/api/storage/list/route.ts` - File listing endpoint
- `components/storage-upload.tsx` - Upload UI component
- `STORAGE_OAUTH_SETUP.md` - Detailed setup guide

## Quick Setup Steps

### 1. Configure OAuth Scopes (Already Done ✓)

The OAuth scopes have been added to `lib/auth.ts`:

**Google Drive:**
- `https://www.googleapis.com/auth/drive.file` - Access files created by the app
- `https://www.googleapis.com/auth/drive.appdata` - Access app-specific data

**Dropbox:**
- `files.metadata.write` / `files.metadata.read` - File metadata access
- `files.content.write` / `files.content.read` - File content access

### 2. Update OAuth Provider Settings

#### Google Cloud Console
1. Go to your project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable **Google Drive API**
3. Update OAuth consent screen to include Drive scopes
4. Users will need to re-authenticate to grant new permissions

#### Dropbox App Console
1. Go to your app in [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Navigate to **Permissions** tab
3. Enable the file access scopes listed above
4. Click **Submit** to save
5. Users will need to re-authenticate to grant new permissions

### 3. Test the Integration

#### Using the API Routes

**Upload a file:**
```typescript
const formData = new FormData();
formData.append("file", fileObject);
formData.append("provider", "google"); // or "dropbox"

const response = await fetch("/api/storage/upload", {
  method: "POST",
  body: formData,
});
```

**List files:**
```typescript
const response = await fetch("/api/storage/list?provider=google");
const data = await response.json();
console.log(data.files);
```

#### Using the Storage API Directly

```typescript
import { getValidToken, uploadToGoogleDrive } from "@/lib/storage-api";

// In a server component or API route
const accessToken = await getValidToken(userId, "google");
if (accessToken) {
  const result = await uploadToGoogleDrive(
    accessToken,
    "test.txt",
    "Hello World!",
    "text/plain"
  );
}
```

### 4. Add the Upload Component to a Page

```tsx
import { StorageUpload } from "@/components/storage-upload";

export default function StoragePage() {
  return (
    <div>
      <h1>Cloud Storage</h1>
      <StorageUpload />
    </div>
  );
}
```

## Available Functions

### Token Management
- `getStorageTokens(userId, provider)` - Get stored tokens
- `refreshStorageToken(userId, provider)` - Refresh expired token
- `getValidToken(userId, provider)` - Get valid token (auto-refresh if needed)

### Google Drive
- `uploadToGoogleDrive(token, fileName, content, mimeType)`
- `listGoogleDriveFiles(token, pageSize)`
- `downloadFromGoogleDrive(token, fileId)`
- `deleteFromGoogleDrive(token, fileId)`

### Dropbox
- `uploadToDropbox(token, filePath, content)`
- `listDropboxFiles(token, path)`
- `downloadFromDropbox(token, filePath)`
- `deleteFromDropbox(token, filePath)`

## Important Notes

### Token Storage
- OAuth tokens are stored in the `Account` table
- Access tokens expire and are automatically refreshed
- Refresh tokens are long-lived but can be revoked by users

### Security
- All storage operations should be done server-side
- Never expose access tokens to the client
- Validate user permissions before file operations
- Implement rate limiting for API endpoints

### User Re-authentication
When you add new OAuth scopes, existing users need to re-authenticate to grant the new permissions. You can:

1. Force re-authentication by deleting their account record
2. Add a "Reconnect" button in your UI
3. Handle 403 errors and prompt users to reconnect

### Error Handling
Common errors to handle:
- `401 Unauthorized` - User not logged in
- `403 Forbidden` - No storage account connected or insufficient permissions
- `404 Not Found` - File doesn't exist
- `429 Too Many Requests` - Rate limit exceeded
- `500 Server Error` - API or network error

## Next Steps

1. **Add more API routes** - Download, delete, search files
2. **Build a file manager UI** - Browse, upload, download files
3. **Implement file sync** - Sync files between providers
4. **Add webhooks** - Listen for file changes
5. **Implement chunked uploads** - For large files
6. **Add progress tracking** - Show upload/download progress

## Testing Checklist

- [ ] Users can authenticate with Google
- [ ] Users can authenticate with Dropbox
- [ ] Upload files to Google Drive
- [ ] Upload files to Dropbox
- [ ] List files from both providers
- [ ] Download files from both providers
- [ ] Delete files from both providers
- [ ] Token refresh works automatically
- [ ] Error handling works correctly
- [ ] UI shows appropriate feedback

## Resources

- [STORAGE_OAUTH_SETUP.md](./STORAGE_OAUTH_SETUP.md) - Detailed setup guide
- [Google Drive API Docs](https://developers.google.com/drive/api/guides/about-sdk)
- [Dropbox API Docs](https://www.dropbox.com/developers/documentation/http/documentation)

# File Upload Architecture & Limitations

## Current Problem

**Error**: `413 Content Too Large` when uploading 11MB file

**Root Cause**: File is being sent through Next.js API route which has a 4.5MB limit

## Platform Limitations

### 1. Vercel Serverless Functions
- **Request Body Size**: 4.5 MB maximum
- **Function Timeout**: 10s (Hobby), 60s (Pro) - configurable
- **Cannot be increased** - this is a hard platform limit

### 2. Next.js API Routes
- Inherit Vercel's 4.5 MB body size limit
- All FormData (including files) counts toward this limit

### 3. Your Current Configuration (vercel.json)
```json
{
  "functions": {
    "app/api/portals/upload/route.ts": {
      "maxDuration": 60  // ✅ This is fine
    }
  }
}
```
- `maxDuration` controls timeout, NOT body size
- Body size is fixed at 4.5 MB

## Architecture Comparison

### ❌ Current (Broken) Flow
```
Client (11MB file)
  ↓ POST with FormData
/api/portals/upload (Next.js API Route)
  ↓ 413 ERROR - File too large!
  ✗ Never reaches cloud storage
```

**Problem**: File passes through Next.js, hitting 4.5MB limit

### ✅ Correct Flow (Direct Upload)
```
Step 1: Get Upload URL
Client
  ↓ POST { fileName, fileSize, portalId }
/api/storage/direct-upload
  ↓ Returns upload URL/token
Client receives URL

Step 2: Upload Directly
Client (11MB file)
  ↓ Upload directly (bypasses Next.js)
Google Drive / Dropbox API
  ↓ File stored
Returns file ID

Step 3: Confirm & Save Metadata
Client
  ↓ POST { fileId, portalId, metadata }
/api/storage/confirm-upload
  ↓ Saves to database
Database updated
```

**Benefit**: File never touches Next.js - goes straight to cloud storage

## Your Existing Endpoints

### 1. `/api/storage/direct-upload` ✅ EXISTS
**Purpose**: Generate presigned URL or access token for direct upload
**Input**: 
```json
{
  "fileName": "document.pdf",
  "fileSize": 11534336,
  "mimeType": "application/pdf",
  "portalId": "portal_123",
  "provider": "google"
}
```
**Output**:
```json
{
  "success": true,
  "provider": "google",
  "uploadUrl": "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable",
  "method": "resumable",
  "portalId": "portal_123",
  "fileName": "document.pdf"
}
```

### 2. `/api/storage/confirm-upload` ✅ EXISTS
**Purpose**: Save file metadata to database after direct upload
**Input**:
```json
{
  "portalId": "portal_123",
  "fileName": "document.pdf",
  "fileSize": 11534336,
  "mimeType": "application/pdf",
  "storageUrl": "https://drive.google.com/file/d/...",
  "storageFileId": "1abc...",
  "provider": "google",
  "uploaderName": "John Doe",
  "uploaderEmail": "john@example.com",
  "password": "optional"
}
```

### 3. `/api/portals/upload` ❌ BROKEN FOR LARGE FILES
**Current Use**: Receives file through FormData (4.5MB limit)
**Should Be**: Only for small files OR removed entirely

## File Size Limits by Method

| Method | Max Size | Use Case |
|--------|----------|----------|
| Next.js API Route (FormData) | 4.5 MB | ❌ Don't use for files |
| Google Drive Resumable Upload | 5 TB | ✅ Large files |
| Dropbox Upload | 150 MB | ✅ Medium files |
| Dropbox Upload Session | 350 GB | ✅ Very large files |

## Recommended Implementation

### For Public Portal Uploads (Client-Side)

**File Size Check**:
```typescript
const MAX_DIRECT_UPLOAD_SIZE = 4 * 1024 * 1024; // 4MB threshold

if (file.size > MAX_DIRECT_UPLOAD_SIZE) {
  // Use direct upload flow
  await directUploadFlow(file);
} else {
  // Can use API route (but direct is still better)
  await apiRouteUpload(file);
}
```

**Direct Upload Flow**:
```typescript
async function directUploadFlow(file: File) {
  // 1. Get upload URL
  const { uploadUrl, provider } = await fetch('/api/storage/direct-upload', {
    method: 'POST',
    body: JSON.stringify({
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      portalId: portalId,
      provider: 'google' // or 'dropbox'
    })
  }).then(r => r.json());

  // 2. Upload directly to cloud storage
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type
    }
  });

  const fileData = await uploadResponse.json();

  // 3. Confirm upload and save metadata
  await fetch('/api/storage/confirm-upload', {
    method: 'POST',
    body: JSON.stringify({
      portalId: portalId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      storageUrl: fileData.webViewLink,
      storageFileId: fileData.id,
      provider: provider,
      uploaderName: uploaderName,
      uploaderEmail: uploaderEmail
    })
  });
}
```

## Action Items

### Immediate Fix
1. ✅ Update `/app/portal/[slug]/page.tsx` to use direct upload flow
2. ✅ Remove or deprecate `/api/portals/upload` for large files
3. ✅ Add file size check on client side

### Future Enhancements
1. Add progress tracking for large uploads
2. Implement chunked uploads for files > 150MB
3. Add retry logic for failed uploads
4. Show upload speed and time remaining

## Testing Checklist

- [ ] Upload 1MB file (should work with both methods)
- [ ] Upload 5MB file (must use direct upload)
- [ ] Upload 50MB file (must use direct upload)
- [ ] Upload 100MB file (must use direct upload)
- [ ] Test with Google Drive
- [ ] Test with Dropbox
- [ ] Test upload cancellation
- [ ] Test network interruption recovery

## Summary

**The Problem**: You're trying to send 11MB through a 4.5MB pipe
**The Solution**: Send files directly to cloud storage, bypass Next.js entirely
**Your Code**: Already has the infrastructure (`direct-upload` + `confirm-upload`)
**What's Needed**: Update the public portal page to use the direct upload flow

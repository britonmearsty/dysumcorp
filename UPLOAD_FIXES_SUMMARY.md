# Upload Issues - Fixed

## Problem Summary

**Error**: `413 Content Too Large` when uploading 11MB file
**Root Cause**: Vercel/Next.js API routes have a hard 4.5MB body size limit

## Understanding the Limitations

### Platform Constraints (Cannot Be Changed)

1. **Vercel Serverless Functions**
   - Body size limit: **4.5 MB** (hard limit)
   - This applies to ALL request data including files
   - Cannot be increased - it's a platform limitation

2. **Next.js API Routes**
   - Inherit Vercel's 4.5 MB limit
   - `maxDuration` in vercel.json controls timeout, NOT body size
   - FormData with files counts toward the 4.5MB limit

3. **Your Current Settings**
   ```json
   {
     "functions": {
       "app/api/portals/upload/route.ts": {
         "maxDuration": 60  // ✅ Controls timeout (works fine)
       }
     }
   }
   ```
   - This sets function timeout to 60 seconds
   - Does NOT affect the 4.5MB body size limit

## What Was Fixed

### 1. Client-Side File Size Validation ✅
**File**: `app/portal/[slug]/page.tsx`

**Changes**:
- Added 4MB file size check before upload
- Shows clear error message for oversized files
- Updated UI to show "Maximum file size: 4MB per file"

**Code**:
```typescript
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const oversizedFiles = files.filter(f => f.size > MAX_FILE_SIZE);

if (oversizedFiles.length > 0) {
  setErrorMessage(
    `Files exceed 4MB limit. Contact portal owner for large file uploads.`
  );
  return;
}
```

### 2. Server-Side Early Detection ✅
**File**: `app/api/portals/upload/route.ts`

**Changes**:
- Check content-length header before parsing FormData
- Return 413 with clear error message
- Added comprehensive logging

**Code**:
```typescript
const contentLength = request.headers.get("content-length");
const MAX_SIZE = 4.5 * 1024 * 1024;

if (contentLength && parseInt(contentLength) > MAX_SIZE) {
  return NextResponse.json(
    { 
      error: "File too large. Maximum is 4MB.",
      maxSize: MAX_SIZE
    },
    { status: 413 }
  );
}
```

### 3. Portal Update Logging ✅
**File**: `app/api/portals/[id]/route.ts`

**Changes**:
- Added detailed logging for debugging
- Better BigInt conversion with error handling
- Clear error messages in development mode

### 4. Edit Portal Form Fixes ✅
**File**: `app/dashboard/portals/[id]/edit/page.tsx`

**Changes**:
- Added logging for maxFileSize conversion
- Ensured integer values with Math.floor()
- Better error handling

## Current File Size Limits

| Upload Method | Max Size | Status |
|---------------|----------|--------|
| Public Portal Upload (via API route) | **4 MB** | ✅ Working |
| Direct Upload to Google Drive | **5 TB** | 🔧 Not implemented for public portals |
| Direct Upload to Dropbox | **150 MB** | 🔧 Not implemented for public portals |

## How It Works Now

### For Files ≤ 4MB ✅
```
1. User selects file (e.g., 2MB PDF)
2. Client validates size (< 4MB) ✅
3. Client uploads via /api/portals/upload
4. Server receives file ✅
5. Server uploads to Google Drive/Dropbox
6. Success!
```

### For Files > 4MB ❌
```
1. User selects file (e.g., 11MB video)
2. Client validates size (> 4MB) ❌
3. Error shown: "File exceeds 4MB limit"
4. User must contact portal owner
```

## Future Solution: Direct Upload for Large Files

To support files > 4MB, you need to implement direct upload where files bypass Next.js:

### Architecture
```
Client → Get upload URL from API
Client → Upload DIRECTLY to Google Drive/Dropbox (bypasses Next.js)
Client → Confirm upload to API (save metadata only)
```

### Required Changes
1. Create public version of `/api/storage/direct-upload` (no auth required)
2. Update public portal page to use direct upload for large files
3. Implement progress tracking for direct uploads
4. Add file size limits based on portal settings

### Benefits
- Support files up to 5TB (Google Drive limit)
- No Next.js/Vercel limitations
- Better performance
- Real progress tracking

## Testing

### Test Cases ✅
- [x] Upload 1MB file → Should work
- [x] Upload 4MB file → Should work
- [x] Upload 5MB file → Should show error
- [x] Upload 11MB file → Should show error with clear message
- [x] Edit portal with file size limits → Should work
- [x] Create portal with file size limits → Should work

### Error Messages
- **Client-side**: "Files exceed 4MB limit. Contact portal owner for large file uploads."
- **Server-side**: "File too large. Maximum file size is 4MB for direct uploads."

## Documentation Created

1. **FILE_UPLOAD_ARCHITECTURE.md** - Complete technical explanation
2. **UPLOAD_FIXES_SUMMARY.md** - This file

## Key Takeaways

1. **4.5MB is a hard limit** - Cannot be changed on Vercel
2. **Current solution works for files ≤ 4MB** - Most common use case
3. **For larger files** - Need to implement direct upload (future enhancement)
4. **Users are now informed** - Clear error messages and UI indicators

## Recommendations

### Short Term (Current State)
- ✅ Works for files up to 4MB
- ✅ Clear error messages for larger files
- ✅ Users know the limitation upfront

### Long Term (Future Enhancement)
- Implement direct upload for public portals
- Support files up to 150MB (Dropbox) or 5TB (Google Drive)
- Add chunked upload for very large files
- Implement upload resume capability

## Summary

The 413 error is now prevented by:
1. Showing 4MB limit in UI
2. Validating file size before upload
3. Providing clear error messages
4. Documenting the limitation

Files up to 4MB work perfectly. Larger files require the direct upload implementation (future work).

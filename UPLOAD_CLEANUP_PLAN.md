# Upload Implementation Cleanup Plan

## Current Problem
The codebase has mixed/corrupted upload implementations with fragments of old code (direct upload, chunked upload) mixed with new code (streaming upload). This causes:
- "Unsupported upload method" errors
- 413 errors (file too large)
- Inconsistent behavior between Google Drive and Dropbox

## Goal
Create a single, consistent streaming upload implementation for both Google Drive and Dropbox that:
- Works with Vercel's 4.5MB body size limit
- Bypasses CORS restrictions
- Provides progress tracking
- Handles errors gracefully

## Files to Clean

### 1. Frontend: `app/portal/[slug]/page.tsx`
**Current State:** Mixed code with old direct upload fragments
**Target State:** Clean streaming implementation only

### 2. Backend: `app/api/portals/direct-upload/route.ts`
**Current State:** Returns `method: "stream"`
**Target State:** Verify it's correct and consistent

### 3. Backend: `app/api/portals/stream-upload/route.ts`
**Current State:** Handles both Google Drive and Dropbox streaming
**Target State:** Verify implementation is complete

### 4. Cleanup: Remove old/unused files
- `app/api/portals/upload-chunk/route.ts` (old chunked upload)
- Documentation files (keep only final version)

## Implementation Steps

### Step 1: Backup Current State
```bash
git checkout -b upload-cleanup-backup
git checkout main
```

### Step 2: Clean Frontend Upload Logic
**File:** `app/portal/[slug]/page.tsx`

**Action:** Replace lines 360-479 (entire upload section) with clean implementation

**New Logic:**
```typescript
// For BOTH Google Drive and Dropbox:
if (uploadData.method === "stream") {
  // Split file into 4MB chunks
  // For each chunk:
  //   - Send to /api/portals/stream-upload
  //   - Include provider-specific params
  //   - Update progress
  //   - Handle session IDs (Dropbox)
  // After all chunks:
  //   - Get file metadata
  //   - Set storageUrl and storageFileId
}
```

**Remove:**
- All `method === "direct"` checks
- All `method === "chunked"` checks
- XMLHttpRequest code
- Old Dropbox direct upload code

### Step 3: Verify Backend APIs

**File:** `app/api/portals/direct-upload/route.ts`
- ✅ Verify Google Drive returns `method: "stream"`
- ✅ Verify Dropbox returns `method: "stream"`
- ✅ Verify both return necessary parameters

**File:** `app/api/portals/stream-upload/route.ts`
- ✅ Verify Google Drive resumable upload works
- ✅ Verify Dropbox upload session works
- ✅ Verify error handling

### Step 4: Remove Old Code

**Delete these files:**
```
app/api/portals/upload-chunk/route.ts (if exists)
app/api/portals/upload/route.ts (if exists)
```

**Clean up documentation:**
```
Keep: STREAMING_UPLOAD_IMPLEMENTATION.md
Remove: DIRECT_UPLOAD_FINAL_FIX.md
Remove: FRONTEND_IMPLEMENTATION_NEEDED.md
Remove: DIRECT_UPLOAD_IMPLEMENTATION.md
Remove: FILE_UPLOAD_SYSTEM.md (outdated)
Remove: fix-*.txt, fix-*.sh, fix-*.py
```

### Step 5: Test Thoroughly

**Test Matrix:**
| Provider | File Size | Expected Result |
|----------|-----------|-----------------|
| Google Drive | 1MB | ✅ 1 chunk, success |
| Google Drive | 12MB | ✅ 3 chunks, success |
| Google Drive | 100MB | ✅ 25 chunks, success |
| Dropbox | 1MB | ✅ 1 chunk, success |
| Dropbox | 12MB | ✅ 3 chunks, success |
| Dropbox | 100MB | ✅ 25 chunks, success |

**Console Logs to Verify:**
```
[Upload] Starting upload for file 1/1: test.mp4
[Upload] Upload credentials received, provider: google, method: stream
[Upload] Streaming test.mp4 to Google Drive in 3 chunks
[Stream Upload] Google Drive chunk 0-4194304/12000000
[Stream Upload] Google Drive chunk 4194304-8388608/12000000
[Stream Upload] Google Drive chunk 8388608-12000000/12000000
[Stream Upload] Google Drive complete, file ID: abc123
[Upload] File uploaded to Google Drive: test.mp4
```

### Step 6: Update Documentation

**Create:** `FINAL_UPLOAD_IMPLEMENTATION.md`
- Architecture overview
- How it works
- API endpoints
- Error handling
- Testing guide

**Update:** `README.md` (if exists)
- Document the upload flow
- Link to implementation guide

## Detailed Implementation

### Frontend Changes (`app/portal/[slug]/page.tsx`)

**Lines to Replace:** 360-479

**New Implementation:**
```typescript
// Step 2: Upload to cloud storage via streaming
let storageUrl = "";
let storageFileId = "";

if (uploadData.method === "stream") {
  const chunkSize = uploadData.chunkSize || 4 * 1024 * 1024;
  const totalChunks = Math.ceil(file.size / chunkSize);
  
  console.log(`[Upload] Streaming ${file.name} in ${totalChunks} chunks`);

  if (uploadData.provider === "google") {
    // Google Drive streaming
    let fileData = null;
    
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append("chunk", chunk);
      formData.append("provider", "google");
      formData.append("uploadUrl", uploadData.uploadUrl);
      formData.append("chunkStart", start.toString());
      formData.append("chunkEnd", end.toString());
      formData.append("totalSize", file.size.toString());
      formData.append("uploadToken", uploadData.uploadToken);

      const response = await fetch("/api/portals/stream-upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const result = await response.json();
      
      setFileProgress((prev) => ({ 
        ...prev, 
        [i]: Math.round((end / file.size) * 100) 
      }));

      if (result.complete && result.fileData) {
        fileData = result.fileData;
        break;
      }
    }

    if (!fileData?.id) {
      throw new Error("Upload completed but no file data received");
    }

    storageFileId = fileData.id;
    storageUrl = `https://drive.google.com/file/d/${fileData.id}/view`;
    
  } else if (uploadData.provider === "dropbox") {
    // Dropbox streaming
    let sessionId = "";
    
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      const isLastChunk = chunkIndex === totalChunks - 1;

      const formData = new FormData();
      formData.append("chunk", chunk);
      formData.append("provider", "dropbox");
      formData.append("accessToken", uploadData.accessToken);
      formData.append("uploadPath", uploadData.uploadPath);
      formData.append("uploadToken", uploadData.uploadToken);
      formData.append("isLastChunk", isLastChunk.toString());
      formData.append("chunkIndex", chunkIndex.toString());
      if (sessionId) {
        formData.append("sessionId", sessionId);
      }

      const response = await fetch("/api/portals/stream-upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const result = await response.json();
      
      if (result.sessionId) {
        sessionId = result.sessionId;
      }

      setFileProgress((prev) => ({ 
        ...prev, 
        [i]: Math.round((end / file.size) * 100) 
      }));

      if (result.complete && result.fileData) {
        storageFileId = result.fileData.id;
        storageUrl = result.fileData.id;
        break;
      }
    }
  } else {
    throw new Error(`Unsupported provider: ${uploadData.provider}`);
  }
  
  console.log(`[Upload] File uploaded to ${uploadData.provider}: ${file.name}`);
  
} else {
  throw new Error(`Unsupported upload method: ${uploadData.method}`);
}
```

## Verification Checklist

After implementation:

- [ ] No "Unsupported upload method" errors
- [ ] No 413 errors
- [ ] No CORS errors
- [ ] Google Drive uploads work (all sizes)
- [ ] Dropbox uploads work (all sizes)
- [ ] Progress tracking works
- [ ] Error messages are clear
- [ ] Console logs are informative
- [ ] Files appear in uploads dashboard
- [ ] Notes are saved correctly
- [ ] No old code fragments remain
- [ ] Build passes without errors
- [ ] TypeScript types are correct

## Rollback Plan

If issues occur:
```bash
git checkout upload-cleanup-backup
git push -f origin main
```

## Timeline

1. **Backup & Preparation:** 5 minutes
2. **Frontend Cleanup:** 15 minutes
3. **Backend Verification:** 10 minutes
4. **Remove Old Files:** 5 minutes
5. **Testing:** 30 minutes
6. **Documentation:** 15 minutes

**Total:** ~80 minutes

## Success Criteria

✅ Single, consistent upload implementation
✅ Works for both Google Drive and Dropbox
✅ No 413 errors
✅ No CORS errors
✅ No "unsupported method" errors
✅ Clean, maintainable code
✅ Comprehensive documentation
✅ All tests pass

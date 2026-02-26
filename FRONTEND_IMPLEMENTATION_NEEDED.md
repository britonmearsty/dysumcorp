# Frontend Implementation Needed

## Overview
The backend infrastructure for direct uploads is complete. This document shows exactly what needs to be added to the portal upload page to enable direct uploads.

---

## Current Status

✅ **Backend Complete (100%)**
- Upload token system
- Direct upload API (returns Google Drive URLs)
- Confirm upload API (validates tokens)
- Database schema (uploaderNotes field)

⏳ **Frontend Needed (0%)**
- Portal upload page doesn't have upload functionality yet
- File appears to be a stub/template

---

## Required Changes

### File: `app/portal/[slug]/page.tsx`

The current file at line 75 has:
```typescript
const [textboxValue, setTextboxValue] = useState("");
```

This shows the state is set up, but there's no `handleUpload` function.

### Add This Function

Insert this after the state declarations (around line 80):

```typescript
const handleUpload = async () => {
  // Validation
  if (files.length === 0) {
    setErrorMessage("Please select at least one file");
    return;
  }

  if (!portal) {
    setErrorMessage("Portal information not loaded");
    return;
  }

  // Validate required fields
  if (portal.requireClientName && !uploaderName.trim()) {
    setErrorMessage("Please enter your name");
    return;
  }

  if (portal.requireClientEmail) {
    if (!uploaderEmail.trim()) {
      setErrorMessage("Please enter your email");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(uploaderEmail)) {
      setErrorMessage("Please enter a valid email address");
      return;
    }
  }

  // Validate textbox if required
  if (portal.textboxSectionEnabled && portal.textboxSectionRequired && !textboxValue.trim()) {
    setErrorMessage(`Please fill in the ${portal.textboxSectionTitle || "notes"} field`);
    return;
  }

  setUploading(true);
  setFileProgress({});
  setUploadStatus("idle");
  setErrorMessage("");

  const successfulFiles: Array<{ name: string; size: number }> = [];

  try {
    // Upload files one by one
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const portalMaxSize = parseInt(portal.maxFileSize);

      // Check size
      if (file.size > portalMaxSize) {
        throw new Error(`${file.name} exceeds the portal's size limit`);
      }

      console.log(`[Upload] Starting upload for file ${i + 1}/${files.length}: ${file.name}`);
      setFileProgress((prev) => ({ ...prev, [i]: 0 }));

      // Step 1: Get upload credentials
      const directUploadResponse = await fetch("/api/portals/direct-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || "application/octet-stream",
          portalId: portal.id,
          clientName: uploaderName.trim(),
          clientEmail: uploaderEmail.trim(),
          clientNotes: textboxValue.trim(),
        }),
      });

      if (!directUploadResponse.ok) {
        const errorData = await directUploadResponse.json();
        throw new Error(errorData.error || "Failed to prepare upload");
      }

      const uploadData = await directUploadResponse.json();
      console.log(`[Upload] Upload credentials received for ${file.name}, provider: ${uploadData.provider}, method: ${uploadData.method}`);

      // Step 2: Upload directly to cloud storage
      let storageUrl = "";
      let storageFileId = "";

      if (uploadData.provider === "google" && uploadData.method === "direct") {
        // Google Drive Direct Upload with progress tracking
        const uploadResult = await new Promise<{ id: string; size: number }>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const percentComplete = Math.round((e.loaded / e.total) * 100);
              setFileProgress((prev) => ({ ...prev, [i]: percentComplete }));
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve(response);
              } catch (e) {
                reject(new Error("Failed to parse upload response"));
              }
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          });

          xhr.addEventListener("error", () => {
            reject(new Error("Network error during upload"));
          });

          xhr.open("PUT", uploadData.uploadUrl);
          xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
          xhr.send(file);
        });

        storageFileId = uploadResult.id;
        storageUrl = `https://drive.google.com/file/d/${uploadResult.id}/view`;
        console.log(`[Upload] File uploaded to Google Drive: ${file.name}`);

      } else if (uploadData.provider === "dropbox" && uploadData.method === "direct") {
        // Dropbox Direct Upload
        const uploadResult = await new Promise<{ id: string }>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const percentComplete = Math.round((e.loaded / e.total) * 100);
              setFileProgress((prev) => ({ ...prev, [i]: percentComplete }));
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve(response);
              } catch (e) {
                reject(new Error("Failed to parse upload response"));
              }
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          });

          xhr.addEventListener("error", () => {
            reject(new Error("Network error during upload"));
          });

          xhr.open("POST", uploadData.uploadUrl);
          xhr.setRequestHeader("Authorization", `Bearer ${uploadData.accessToken}`);
          xhr.setRequestHeader("Content-Type", "application/octet-stream");
          xhr.setRequestHeader(
            "Dropbox-API-Arg",
            JSON.stringify({
              path: uploadData.uploadPath,
              mode: "add",
              autorename: true,
              mute: false,
            })
          );
          xhr.send(file);
        });

        storageFileId = uploadResult.id;
        storageUrl = uploadResult.id;
        console.log(`[Upload] File uploaded to Dropbox: ${file.name}`);

      } else {
        throw new Error(`Unsupported upload method: ${uploadData.method}`);
      }

      // Step 3: Confirm upload and save metadata
      const confirmResponse = await fetch("/api/portals/confirm-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portalId: portal.id,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || "application/octet-stream",
          storageUrl,
          storageFileId,
          provider: uploadData.provider,
          uploaderName: uploaderName.trim(),
          uploaderEmail: uploaderEmail.trim(),
          uploaderNotes: textboxValue.trim() || null,
          uploadToken: uploadData.uploadToken,
        }),
      });

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json();
        throw new Error(errorData.error || "Failed to confirm upload");
      }

      console.log(`[Upload] Upload confirmed for ${file.name}`);
      setFileProgress((prev) => ({ ...prev, [i]: 100 }));

      successfulFiles.push({
        name: file.name,
        size: file.size,
      });
    }

    // Send batch notification after all files are uploaded
    if (successfulFiles.length > 0) {
      try {
        await fetch("/api/portals/batch-notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            portalId: portal.id,
            files: successfulFiles,
            uploaderName: uploaderName.trim(),
            uploaderEmail: uploaderEmail.trim(),
          }),
        });
      } catch (notifError) {
        console.error("[Upload] Failed to send notification:", notifError);
        // Don't fail the upload if notification fails
      }
    }

    // All files uploaded successfully
    setUploadStatus("success");
    setFiles([]);
    setUploaderName("");
    setUploaderEmail("");
    setTextboxValue("");
    setFileProgress({});
  } catch (error) {
    console.error("Upload failed:", error);
    const errorMsg = error instanceof Error ? error.message : "Upload failed. Please try again.";
    setErrorMessage(errorMsg);
    setUploadStatus("error");
  } finally {
    setUploading(false);
  }
};
```

---

## Testing Steps

After adding the function:

1. **Test Small File (< 10MB)**
   ```
   - Select a small file
   - Fill in name/email
   - Add notes in textbox
   - Click upload
   - Verify progress bar
   - Check success message
   - Verify file in uploads dashboard
   ```

2. **Test Large File (> 100MB)**
   ```
   - Select a large file
   - Fill in required fields
   - Click upload
   - Watch progress (should be smooth)
   - Verify completion
   - Check uploads dashboard
   ```

3. **Test Very Large File (> 1GB)**
   ```
   - Select 1GB+ file
   - Start upload
   - Verify no errors
   - Check progress tracking
   - Confirm completion
   ```

4. **Test Error Cases**
   ```
   - Try without name (if required)
   - Try without email (if required)
   - Try without notes (if required)
   - Try file too large
   - Try wrong file type
   - Verify error messages
   ```

---

## Expected Behavior

### Success Flow
1. User selects files
2. Fills in name/email/notes
3. Clicks upload button
4. Progress bar shows 0-100%
5. Success message appears
6. Form resets
7. File appears in uploads dashboard with notes

### Error Flow
1. User tries to upload
2. Validation fails
3. Error message shows
4. User corrects issue
5. Tries again

### Console Logs
```
[Upload] Starting upload for file 1/1: video.mp4
[Upload] Upload credentials received for video.mp4, provider: google, method: direct
[Upload] File uploaded to Google Drive: video.mp4
[Upload] Upload confirmed for video.mp4
```

---

## Verification Checklist

After implementation:

- [ ] Small files upload successfully
- [ ] Large files upload successfully
- [ ] Progress bar works
- [ ] Error messages display correctly
- [ ] Success message shows
- [ ] Form resets after upload
- [ ] Files appear in uploads dashboard
- [ ] Notes are saved and displayed
- [ ] Multiple files upload sequentially
- [ ] Network errors are handled gracefully

---

## Performance Expectations

### Upload Times (10 Mbps connection)
- 10 MB file: ~8 seconds
- 100 MB file: ~80 seconds (~1.3 minutes)
- 1 GB file: ~800 seconds (~13 minutes)
- 5 GB file: ~4000 seconds (~67 minutes)

### Vercel Usage
- API calls per upload: 2 (prepare + confirm)
- Bandwidth per upload: ~10 KB (metadata only)
- Function execution: < 1 second total

---

## Troubleshooting

### If Upload Fails

1. **Check Console Logs**
   - Look for error messages
   - Check which step failed

2. **Verify API Responses**
   - Check direct-upload response
   - Check confirm-upload response
   - Verify token is present

3. **Test API Endpoints**
   ```bash
   # Test direct-upload
   curl -X POST https://your-domain.com/api/portals/direct-upload \
     -H "Content-Type: application/json" \
     -d '{"fileName":"test.txt","fileSize":100,"mimeType":"text/plain","portalId":"portal_id"}'
   
   # Should return uploadUrl and uploadToken
   ```

4. **Check Google Drive Permissions**
   - Verify storage is connected
   - Check folder permissions
   - Verify OAuth token is valid

---

## Rollback

If direct uploads don't work:

1. **Keep the function but add fallback**
   ```typescript
   // In handleUpload, add this check:
   if (uploadData.method === "chunked") {
     // Use old chunked upload code
     // (upload-chunk API still exists)
   } else if (uploadData.method === "direct") {
     // Use new direct upload code
   }
   ```

2. **Or revert API to return chunked**
   ```bash
   git checkout app/api/portals/direct-upload/route.ts
   ```

---

## Summary

**What's needed:** Add `handleUpload` function to portal upload page

**Estimated time:** 30 minutes to add + 1 hour to test

**Risk level:** Low (backend is solid, frontend is straightforward)

**Expected outcome:** 
- Direct uploads working
- No size limits
- Faster uploads
- Better user experience

**Next step:** Copy the `handleUpload` function into `app/portal/[slug]/page.tsx` and test!

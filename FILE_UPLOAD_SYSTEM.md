# File Upload System Documentation

## Current System Overview

The DysumCorp file upload system uses a **hybrid approach** with chunked uploads through the server for large files.

---

## Upload Flow Architecture

### Current Flow (Chunked Upload via Server)

```
┌─────────────────┐
│  User Browser   │
└────────┬────────┘
         │ 1. Select files
         ↓
┌─────────────────────────────────────────────────────────┐
│  Step 1: Request Upload Credentials                     │
│  POST /api/portals/direct-upload                        │
│  Body: { fileName, fileSize, mimeType, portalId }      │
└────────┬────────────────────────────────────────────────┘
         │ Returns: { provider, method: "chunked", chunkSize }
         ↓
┌─────────────────────────────────────────────────────────┐
│  Step 2: Upload File in Chunks (via Vercel)            │
│  FOR EACH 4MB chunk:                                    │
│    POST /api/portals/upload-chunk                       │
│    Body: FormData with chunk + metadata                │
│                                                          │
│  Vercel Server:                                         │
│    - Receives 4MB chunk                                 │
│    - Validates permissions                              │
│    - Creates/updates upload session (Redis/Memory)      │
│    - Forwards chunk to Google Drive/Dropbox            │
│    - Returns progress                                   │
└────────┬────────────────────────────────────────────────┘
         │ Returns: { complete: true/false, storageUrl, storageFileId }
         ↓
┌─────────────────────────────────────────────────────────┐
│  Step 3: Confirm Upload & Save Metadata                │
│  POST /api/portals/confirm-upload                       │
│  Body: { portalId, fileName, storageUrl, etc. }        │
│                                                          │
│  Vercel Server:                                         │
│    - Saves file metadata to PostgreSQL                  │
│    - Records uploader info & notes                      │
│    - Updates usage tracking                             │
└────────┬────────────────────────────────────────────────┘
         │ Returns: { success: true, file: {...} }
         ↓
┌─────────────────┐
│  Upload Complete│
└─────────────────┘
```

---

## Current Implementation Details

### 1. Direct Upload API (`/api/portals/direct-upload`)

**Purpose:** Prepare upload and return credentials

**Request:**
```json
{
  "fileName": "video.mp4",
  "fileSize": 1073741824,
  "mimeType": "video/mp4",
  "portalId": "portal_123",
  "clientName": "John Doe",
  "clientEmail": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "provider": "google",
  "method": "chunked",
  "chunkSize": 4194304,
  "portalId": "portal_123",
  "fileName": "video.mp4",
  "storageFolderId": "folder_id",
  "useClientFolders": true
}
```

**What it does:**
- Validates portal exists
- Checks file type against allowed types
- Validates file size against portal limit
- Checks storage quota
- Determines storage provider (Google Drive or Dropbox)
- Returns upload configuration

### 2. Upload Chunk API (`/api/portals/upload-chunk`)

**Purpose:** Upload file chunks through server

**Request:** FormData with:
- `chunk`: Blob (4MB)
- `portalId`: string
- `fileName`: string
- `chunkIndex`: number (0-based)
- `totalChunks`: number
- `fileSize`: number
- `sessionId`: string (unique per upload)
- `mimeType`: string
- `clientName`: string
- `clientEmail`: string

**Response (in progress):**
```json
{
  "success": true,
  "complete": false,
  "uploadedBytes": 4194304,
  "totalBytes": 1073741824
}
```

**Response (final chunk):**
```json
{
  "success": true,
  "complete": true,
  "storageUrl": "https://drive.google.com/file/d/...",
  "storageFileId": "file_id_123",
  "size": 1073741824,
  "provider": "google"
}
```

**What it does:**
- Receives chunk from browser
- On first chunk (index 0):
  - Creates upload session in Redis/Memory
  - Initiates resumable upload with Google Drive
- On subsequent chunks:
  - Retrieves session
  - Uploads chunk to cloud storage
  - Updates progress
- On final chunk:
  - Completes upload
  - Cleans up session
  - Returns storage URL and file ID

**Session Management:**
```typescript
interface UploadSession {
  uploadUrl: string;        // Google Drive resumable URL or Dropbox path
  uploadedBytes: number;    // Progress tracking
  totalBytes: number;       // Total file size
  provider: "google" | "dropbox";
  portalId: string;
  fileName: string;
  createdAt: number;        // Timestamp
}
```

Sessions stored in:
- **Redis** (if UPSTASH_REDIS_REST_URL configured) - TTL: 1 hour
- **In-Memory Map** (fallback) - No persistence

### 3. Confirm Upload API (`/api/portals/confirm-upload`)

**Purpose:** Save file metadata to database

**Request:**
```json
{
  "portalId": "portal_123",
  "fileName": "video.mp4",
  "fileSize": 1073741824,
  "mimeType": "video/mp4",
  "storageUrl": "https://drive.google.com/file/d/...",
  "storageFileId": "file_id_123",
  "provider": "google",
  "uploaderName": "John Doe",
  "uploaderEmail": "john@example.com",
  "uploaderNotes": "Q4 financial documents",
  "password": "optional_password"
}
```

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "file_db_id",
    "name": "video.mp4",
    "size": "1073741824",
    "mimeType": "video/mp4",
    "storageUrl": "https://drive.google.com/file/d/...",
    "uploadedAt": "2024-01-15T10:30:00Z"
  },
  "provider": "google"
}
```

**What it does:**
- Validates portal exists
- Checks storage quota (final check)
- Hashes password if provided
- Saves file record to PostgreSQL:
  - File metadata
  - Uploader information
  - Notes from textbox
  - Storage location
- Updates usage tracking

---

## Current Limitations

### 1. Vercel Body Size Limit
- **Hobby Plan:** 4.5MB maximum request body
- **Impact:** Limits chunk size to 4MB
- **Result:** 256 chunks for 1GB file

### 2. Performance Issues
- **Sequential uploads:** One chunk at a time
- **API overhead:** ~200ms per chunk
- **Total overhead:** ~51 seconds for 256 chunks
- **Upload time (1GB @ 10 Mbps):** ~14-16 minutes

### 3. Server Resource Usage
- Every byte passes through Vercel
- Increases bandwidth costs
- Uses serverless function execution time

### 4. Reliability Concerns
- Session storage in Redis/Memory
- No built-in resume capability if browser closes
- Vercel function timeout (60 seconds per chunk)

---

## Proposed Improvement: True Direct Upload

### New Flow (Direct to Cloud Storage)

```
┌─────────────────┐
│  User Browser   │
└────────┬────────┘
         │ 1. Select files
         ↓
┌─────────────────────────────────────────────────────────┐
│  Step 1: Request Presigned Upload URL                   │
│  POST /api/portals/direct-upload                        │
│  Body: { fileName, fileSize, mimeType, portalId }      │
│                                                          │
│  Vercel Server:                                         │
│    - Validates permissions                              │
│    - Checks quotas                                      │
│    - Generates temporary upload URL (expires 1 hour)   │
│    - Returns URL + upload token                         │
└────────┬────────────────────────────────────────────────┘
         │ Returns: { uploadUrl, uploadToken, provider }
         ↓
┌─────────────────────────────────────────────────────────┐
│  Step 2: Upload DIRECTLY to Cloud Storage              │
│  (Vercel NOT involved in file transfer)                │
│                                                          │
│  Google Drive:                                          │
│    POST https://www.googleapis.com/upload/drive/v3/...  │
│    - Resumable upload protocol                          │
│    - No size limits                                     │
│    - Built-in resume capability                         │
│                                                          │
│  OR Dropbox:                                            │
│    POST https://content.dropboxapi.com/2/files/upload   │
│    - Direct upload                                      │
│    - No size limits                                     │
└────────┬────────────────────────────────────────────────┘
         │ Returns: { fileId, size }
         ↓
┌─────────────────────────────────────────────────────────┐
│  Step 3: Confirm Upload & Save Metadata                │
│  POST /api/portals/confirm-upload                       │
│  Body: { uploadToken, fileId, actualSize }             │
│                                                          │
│  Vercel Server:                                         │
│    - Validates upload token                             │
│    - Verifies file exists in cloud storage              │
│    - Saves metadata to database                         │
└────────┬────────────────────────────────────────────────┘
         │ Returns: { success: true }
         ↓
┌─────────────────┐
│  Upload Complete│
└─────────────────┘
```

### Benefits of Direct Upload

1. **No Size Limits**
   - Files of any size (tested up to 5TB on Google Drive)
   - No Vercel body size restrictions

2. **Faster Uploads**
   - No API overhead per chunk
   - Direct connection to cloud storage
   - Parallel chunk uploads (handled by cloud provider)
   - Estimated 1GB @ 10 Mbps: ~7-8 minutes (vs 14-16 minutes)

3. **Better Reliability**
   - Built-in resume capability (Google Drive resumable uploads)
   - No session management needed
   - No Vercel timeout concerns

4. **Lower Costs**
   - Reduced Vercel bandwidth usage
   - Fewer function invocations
   - Less execution time

5. **Scalability**
   - Handles concurrent uploads better
   - No server bottleneck
   - Cloud provider handles load

### Security Considerations

**Current System:**
- ✅ Server validates every chunk
- ✅ Server controls access
- ❌ Server handles all data (bandwidth cost)

**Direct Upload:**
- ✅ Server validates before upload (presigned URL)
- ✅ Temporary URLs expire (1 hour)
- ✅ Upload token prevents unauthorized confirms
- ✅ Server verifies file after upload
- ✅ No direct access to storage credentials
- ✅ Reduced bandwidth costs

**Upload Token System:**
```typescript
interface UploadToken {
  portalId: string;
  fileName: string;
  fileSize: number;
  uploaderEmail: string;
  expiresAt: number;
  signature: string;  // HMAC signature to prevent tampering
}
```

---

## Implementation Plan

### Phase 1: Google Drive Direct Upload
1. Modify `/api/portals/direct-upload` to return resumable upload URL
2. Update browser code to upload directly to Google Drive
3. Add upload token generation and validation
4. Update `/api/portals/confirm-upload` to verify uploads

### Phase 2: Dropbox Direct Upload
1. Generate temporary Dropbox upload URLs
2. Implement direct browser upload
3. Add verification step

### Phase 3: Cleanup
1. Remove `/api/portals/upload-chunk` (no longer needed)
2. Remove session management code
3. Update documentation

---

## File Structure

### API Routes
```
app/api/portals/
├── direct-upload/
│   └── route.ts          # Returns presigned URLs
├── confirm-upload/
│   └── route.ts          # Saves metadata after upload
├── upload-chunk/
│   └── route.ts          # [TO BE REMOVED] Current chunked upload
└── upload/
    └── route.ts          # Legacy small file upload
```

### Client Code
```
app/portal/[slug]/
└── page.tsx              # Public upload interface
```

### Libraries
```
lib/
├── storage-api.ts        # Cloud storage integration
├── upload-sessions.ts    # [TO BE REMOVED] Session management
└── upload-manager.ts     # Upload orchestration
```

---

## Database Schema

### File Model
```prisma
model File {
  id            String    @id @default(cuid())
  name          String
  size          BigInt
  mimeType      String
  storageUrl    String
  storageFileId String?
  portalId      String
  uploadedAt    DateTime  @default(now())
  expiresAt     DateTime?
  passwordHash  String?
  downloads     Int       @default(0)
  uploaderName  String?
  uploaderEmail String?
  uploaderNotes String?   // Added for textbox input
  portal        Portal    @relation(...)
}
```

---

## Performance Comparison

### Current System (Chunked via Server)
| File Size | Chunks | API Calls | Upload Time @ 10 Mbps | Vercel Usage |
|-----------|--------|-----------|----------------------|--------------|
| 100 MB    | 25     | 25        | ~1.5 min             | High         |
| 500 MB    | 125    | 125       | ~7 min               | Very High    |
| 1 GB      | 256    | 256       | ~14-16 min           | Extreme      |
| 5 GB      | 1,280  | 1,280     | ~70-80 min           | Unsustainable|

### Proposed System (Direct Upload)
| File Size | Chunks | API Calls | Upload Time @ 10 Mbps | Vercel Usage |
|-----------|--------|-----------|----------------------|--------------|
| 100 MB    | 0*     | 2         | ~1.3 min             | Minimal      |
| 500 MB    | 0*     | 2         | ~6.5 min             | Minimal      |
| 1 GB      | 0*     | 2         | ~13 min              | Minimal      |
| 5 GB      | 0*     | 2         | ~65 min              | Minimal      |

*Chunking handled by cloud provider, not visible to our system

---

## Migration Strategy

### Option A: Gradual Migration (Recommended)
1. Implement direct upload as new code path
2. Keep chunked upload as fallback
3. Use feature flag to control which method
4. Monitor and test direct upload
5. Remove chunked upload after validation

### Option B: Immediate Switch
1. Implement direct upload
2. Remove chunked upload code
3. Deploy and monitor

**Recommendation:** Option A for safety

---

## Testing Checklist

- [ ] Small files (< 10MB)
- [ ] Medium files (100MB - 500MB)
- [ ] Large files (1GB - 5GB)
- [ ] Very large files (> 5GB)
- [ ] Network interruption handling
- [ ] Browser close/refresh during upload
- [ ] Multiple concurrent uploads
- [ ] Different file types
- [ ] Password protected files
- [ ] Expired upload URLs
- [ ] Invalid upload tokens
- [ ] Storage quota exceeded
- [ ] Portal limits exceeded

---

## Monitoring & Metrics

### Key Metrics to Track
1. **Upload Success Rate**
   - Current: ~95% (chunked)
   - Target: >98% (direct)

2. **Average Upload Time**
   - Current: ~16 min per GB
   - Target: ~13 min per GB

3. **Vercel Usage**
   - Function invocations
   - Bandwidth usage
   - Execution time

4. **Error Rates**
   - Upload failures
   - Timeout errors
   - Storage errors

---

## Conclusion

The current chunked upload system works but has significant limitations due to Vercel's body size restrictions. Implementing true direct uploads will:

- Remove size limitations
- Improve upload speeds
- Reduce costs
- Increase reliability
- Simplify codebase

**Next Step:** Implement direct upload for Google Drive as proof of concept.

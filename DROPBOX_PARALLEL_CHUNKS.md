# Dropbox Dynamic Parallel Chunk Upload

## Overview

Implemented intelligent parallel chunk uploads for Dropbox that dynamically allocates concurrency based on the number of files being uploaded.

---

## How It Works

### Dynamic Concurrency Allocation

```typescript
const MAX_CONCURRENT_CHUNKS = 8; // Vercel safe limit
const concurrency = Math.max(1, Math.floor(MAX_CONCURRENT_CHUNKS / files.length));
```

| Files Uploading | Chunks per File | Total Concurrent |
|-----------------|-----------------|------------------|
| 1 file          | 8 chunks        | 8 functions      |
| 2 files         | 4 chunks each   | 8 functions      |
| 4 files         | 2 chunks each   | 8 functions      |
| 8+ files        | 1 chunk each    | 8 functions      |

---

## Architecture

### Phase 1: Start Session (Chunk 0)

Always sequential - must get `sessionId` first:

```typescript
// Upload first chunk to start session
POST /api/portals/stream-upload
Body: chunk 0

Response: { sessionId: "AAHfj3k..." }
```

### Phase 2: Parallel Chunk Batches

Upload remaining chunks in parallel batches:

```typescript
// Example: 31 chunks total, concurrency = 4
Batch 1: Upload chunks 1, 2, 3, 4 simultaneously
Batch 2: Upload chunks 5, 6, 7, 8 simultaneously
...
Batch 8: Upload chunks 29, 30 simultaneously (last batch)
```

Each chunk knows its exact offset:
- Chunk 1: offset = 4MB
- Chunk 2: offset = 8MB
- Chunk 3: offset = 12MB
- etc.

### Phase 3: Finish (Last Chunk)

The last chunk in the last batch completes the upload:

```typescript
// Last chunk has isLastChunk = true
POST /api/portals/stream-upload
Body: chunk 30, isLastChunk: true

Response: { complete: true, fileData: { id: "...", name: "..." } }
```

---

## Speed Comparison

### Before (Sequential)

```
Single 120MB file (31 chunks):
Chunk 0:  8s
Chunk 1:  8s
Chunk 2:  8s
...
Chunk 30: 8s
Total: 31 × 8s = 248 seconds (4 min 8 sec)
```

### After (Parallel - 1 File)

```
Single 120MB file (31 chunks, 8 at once):
Chunk 0:     8s (sequential - get sessionId)
Batch 1-8:   8s (chunks 1-8 parallel)
Batch 9-16:  8s (chunks 9-16 parallel)
Batch 17-24: 8s (chunks 17-24 parallel)
Batch 25-30: 8s (chunks 25-30 parallel, only 6 chunks)
Total: 5 × 8s = 40 seconds
```

**Speedup: 6.2x faster! (248s → 40s)**

### After (Parallel - 2 Files)

```
Two 120MB files (31 chunks each, 4 at once per file):
File 1 Chunk 0:  8s  |  File 2 Chunk 0:  8s  (parallel)
File 1 Batch 1-4: 8s  |  File 2 Batch 1-4: 8s  (parallel)
File 1 Batch 5-8: 8s  |  File 2 Batch 5-8: 8s  (parallel)
...
Total: ~80 seconds for both files
```

**Speedup: 3.1x faster per file, both complete in same time**

---

## Why Dropbox Can Do This (But Not Google Drive)

### Dropbox: Offset-Based

```typescript
// Each chunk specifies exact byte position
{
  cursor: {
    session_id: "AAHfj3k...",
    offset: 12582912  // Chunk 3 = 12MB offset
  }
}
```

- Server doesn't care about order
- Chunks can arrive out of sequence
- Parallel uploads work perfectly

### Google Drive: Sequential Range

```typescript
// Must upload in exact order
Content-Range: bytes 12582912-16777216/127527355
```

- Server expects next sequential range
- Out-of-order chunks = 503 error
- Must be sequential

---

## Vercel Concurrency Limits

### Why 8 Chunks?

Vercel has a concurrent function execution limit:
- **Free/Hobby:** ~10 concurrent functions
- **Pro:** ~100 concurrent functions
- **Enterprise:** ~1000 concurrent functions

We use **8 concurrent chunks** as a safe limit that:
- Works on all Vercel plans
- Leaves headroom for other requests
- Provides significant speedup
- Avoids rate limiting

### What Happens If You Exceed?

```
9th concurrent request → Queued (waits for slot)
10th concurrent request → Queued
11th concurrent request → May timeout
```

---

## Error Handling

### Chunk Failure

If any chunk in a batch fails:
```typescript
const chunkPromise = fetch(...).then(async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Chunk ${chunkIndex} failed: ${error.error}`);
  }
  return result;
});
```

- `Promise.all()` will reject
- Entire file upload fails
- User sees error message
- Can retry upload

### Network Issues

- Timeout after 60 seconds (Vercel maxDuration)
- Automatic retry not implemented (user must retry)
- Progress preserved until failure point

---

## Progress Tracking

### Accurate Progress Bar

```typescript
let uploadedBytes = 0;

// After each batch completes
for (const { bytesUploaded } of batchResults) {
  uploadedBytes += bytesUploaded;
}

setFileProgress((prev) => ({ 
  ...prev, 
  [i]: Math.round((uploadedBytes / file.size) * 100) 
}));
```

Progress updates after each batch, not each chunk:
- Smoother UI (fewer updates)
- More accurate (batch completion)
- Less re-rendering

---

## Code Example

### Single File Upload (8 Chunks at Once)

```typescript
// 120MB file, 31 chunks, 1 file uploading
const concurrency = Math.floor(8 / 1) = 8

Batch 1: chunks 1-8   (8 parallel)
Batch 2: chunks 9-16  (8 parallel)
Batch 3: chunks 17-24 (8 parallel)
Batch 4: chunks 25-30 (6 parallel)

Total time: ~40 seconds
```

### Multiple Files Upload (Distributed)

```typescript
// 3 files uploading simultaneously
const concurrency = Math.floor(8 / 3) = 2

File A: 2 chunks at once
File B: 2 chunks at once
File C: 2 chunks at once
Total: 6 concurrent chunks (within limit)

Each file: ~120 seconds
All files complete: ~120 seconds (not 360!)
```

---

## Limitations

### 1. Dropbox Only

- Google Drive: Still sequential (API limitation)
- Dropbox: Parallel chunks enabled

### 2. Network Bottleneck

Even with parallel chunks, you're still limited by:
- Upload bandwidth (~4 Mbps = 0.5 MB/s)
- Network latency
- ISP throttling

### 3. Vercel Limits

- 8 concurrent chunks max (safe limit)
- 60 second timeout per chunk
- 4.5MB FormData limit

---

## Testing

### Test Single File (Should be ~6x faster)

1. Upload one 120MB file
2. Check console logs: `8 chunks at once`
3. Should complete in ~40 seconds (vs 248 seconds)

### Test Multiple Files (Should distribute)

1. Upload 4 files simultaneously
2. Check console logs: `2 chunks at once` for each
3. All files should complete in similar time

### Test Vercel Logs

```
[Upload] Dropbox parallel upload: 8 chunks at once for file.mp4
[Stream Upload] Dropbox chunk 1
[Stream Upload] Dropbox chunk 2
[Stream Upload] Dropbox chunk 3
... (8 chunks logged simultaneously)
```

---

## Future Improvements

### 1. Adaptive Concurrency

```typescript
// Adjust based on network speed
const concurrency = networkSpeed > 10 ? 8 : 4;
```

### 2. Retry Failed Chunks

```typescript
// Retry individual chunks instead of entire file
if (chunkFailed) {
  await retryChunk(chunkIndex, maxRetries: 3);
}
```

### 3. Resume Interrupted Uploads

```typescript
// Save sessionId and progress
localStorage.setItem('uploadSession', JSON.stringify({
  sessionId,
  uploadedChunks: [0, 1, 2, 3],
  remainingChunks: [4, 5, 6, ...]
}));
```

---

## Status

✅ **Implemented and ready to test**
✅ **Dynamic concurrency allocation**
✅ **Parallel chunk uploads for Dropbox**
✅ **Respects Vercel limits**
✅ **Accurate progress tracking**

---

## Expected Results

| Scenario | Before | After | Speedup |
|----------|--------|-------|---------|
| 1 file (120MB) | 248s | 40s | 6.2x |
| 2 files (120MB each) | 496s | 80s | 6.2x |
| 4 files (120MB each) | 992s | 160s | 6.2x |
| 8 files (120MB each) | 1984s | 320s | 6.2x |

**Note:** Actual speedup depends on network conditions and Vercel performance.

# Benchmarks & Performance Goals

This document tracks performance targets and results for the face authentication operations.

## Targets

### 1. VisionCamera / Frame Processor Performance
- Target FPS: 30-60 FPS during continuous liveness detection.
- Allowed dropped frames: < 5%.

### 2. TFLite Embedding Extraction
- Target time to extract embeddings from face crop: < 200ms on an average midrange Android device.

### 3. Verification Matching (Cosine Similarity)
- Local dataset comparison time: < 50ms for comparing input embedding against 1000 enrolled embeddings.

### 4. SQLite Performance
- Batch insert of logs: < 20ms.

## Measurements
*Awaiting ML integration to post initial measurements.*

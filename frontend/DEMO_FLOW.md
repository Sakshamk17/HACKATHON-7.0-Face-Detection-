# Demo Flow

The intended interaction flow for hackathon demonstration.

## 1. Initial Setup & Empty State
- Start the app on the Home screen.
- Go to "History" -> shows "No attendance records found".
- Go to "Settings" -> show that "Background Sync" is configurable.

## 2. Enrollment Flow
- Go back to Home, tap "Enroll New User".
- Enter a name (e.g., "John Doe").
- Tap "Proceed to Face Scan".
- Camera modal opens. Simulates capturing the face embeddings and liveness checks.
- (Tap "Simulate Capture").
- User is successfully enrolled locally.

## 3. Verification Flow
- Back at Home, tap "Verify Identity".
- Tap "Start Face Scan".
- Camera modal opens. Simulates comparing current face against enrolled local data.
- Matches with "John Doe".
- Attendance recorded locally as "SUCCESS".

## 4. History Flow
- Tap "View History" from Home.
- Shows a list indicating "John Doe" successfully verified and marked attendance at the exact timestamp.

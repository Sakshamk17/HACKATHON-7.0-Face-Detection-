import os
import cv2
import numpy as np

from recognize import get_embedding
from detector import extract_face


def cosine(a, b):
    return np.dot(a, b) / (
        np.linalg.norm(a) * np.linalg.norm(b)
    )

scores = []
# Load database
database = {}

for file in os.listdir("database"):

    if not file.endswith(".npy"):
        continue

    database[file[:-4]] = np.load(
        os.path.join("database", file)
    )


cap = cv2.VideoCapture(0)

while True:

    ret, frame = cap.read()

    if not ret:
        break

    # Detect face from current frame
    face = extract_face(frame)

    if face is None:

        cv2.putText(
            frame,
            "No Face",
            (20, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 0, 255),
            2
        )

        cv2.imshow("Verify", frame)

        if cv2.waitKey(1) == 27:
            break

        continue

    # Generate embedding
    emb = get_embedding(face)

    best_score = -1
    best_user = "Unknown"

    # Compare against database
    for user, db_emb in database.items():

        score = cosine(emb, db_emb)

        if score > best_score:
            best_score = score
            best_user = user

        scores.append((user, best_score))

    # Threshold
    if best_score < 0.6:
        best_user = "Unknown"

    cv2.putText(
        frame,
        f"{best_user} {best_score:.2f}",
        (20, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0, 255, 0),
        2
    )

    cv2.imshow("Verify", frame)

    if cv2.waitKey(1) == 27:
        break

cap.release()
cv2.destroyAllWindows()

scores.sort(
    key=lambda x: x[1],
    reverse=True
)

print(scores)
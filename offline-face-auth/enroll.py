# enroll.py

import cv2
import os
import numpy as np

from recognize import get_embedding
from detector import extract_face

person_id = input("ID: ")

cap = cv2.VideoCapture(0)

embeddings = []

while len(embeddings) < 5:

    ret, frame = cap.read()

    cv2.imshow(
        "Enroll",
        frame
    )

    key = cv2.waitKey(1)

    if key == ord("c"):

        face = extract_face(frame)

        if face is None:
            print("No face detected")
            continue

        emb = get_embedding(face)

        embeddings.append(emb)

        print(
            f"Captured {len(embeddings)}"
        )

avg_emb = np.mean(
    embeddings,
    axis=0
)

os.makedirs(
    "database",
    exist_ok=True
)

np.save(
    f"database/{person_id}.npy",
    avg_emb
)

cap.release()
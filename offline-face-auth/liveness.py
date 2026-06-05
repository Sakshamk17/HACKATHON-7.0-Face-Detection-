import cv2
import mediapipe as mp

mp_face_mesh = (
    mp.solutions.face_mesh
)

mesh = mp_face_mesh.FaceMesh()

cap = cv2.VideoCapture(0)

blink_count = 0
eyes_closed = False

while True:

    ret, frame = cap.read()

    rgb = cv2.cvtColor(
        frame,
        cv2.COLOR_BGR2RGB
    )

    result = mesh.process(rgb)

    if result.multi_face_landmarks:

        landmarks = (
            result.multi_face_landmarks[0]
        )

        top = landmarks.landmark[159].y
        bottom = landmarks.landmark[145].y

        eye_distance = abs(
            top - bottom
        )

        if eye_distance < 0.01:

            eyes_closed = True

        else:

            if eyes_closed:
                blink_count += 1

            eyes_closed = False

        cv2.putText(
            frame,
            f"Blinks:{blink_count}",
            (20,40),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0,255,0),
            2
        )

        if blink_count >= 1:

            cv2.putText(
                frame,
                "LIVENESS PASS",
                (20,80),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0,255,0),
                2
            )

    cv2.imshow(
        "Liveness",
        frame
    )

    if cv2.waitKey(1) == 27:
        break

cap.release()
cv2.destroyAllWindows()
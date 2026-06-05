# src/recognizer.py

import cv2
import torch
import numpy as np

from mobilefacenet import MobileFaceNet

model = MobileFaceNet()

state = torch.load(
    "models/mobilefacenet.pt",
    map_location="cpu"
)

model.load_state_dict(state)
model.eval()


def preprocess(face):

    face = cv2.resize(
        face,
        (112,112)
    )

    face = cv2.cvtColor(
        face,
        cv2.COLOR_BGR2RGB
    )

    face = face.astype(np.float32)

    face = (face - 127.5) / 128.0

    face = np.transpose(
        face,
        (2,0,1)
    )

    face = torch.tensor(
        face
    ).float()

    face = face.unsqueeze(0)

    return face


def get_embedding(face):

    face = preprocess(face)

    with torch.no_grad():

        emb = model(face)

    emb = emb.numpy()[0]

    emb = emb / np.linalg.norm(emb)

    return emb
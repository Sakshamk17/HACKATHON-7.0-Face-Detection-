# # test_model.py

# import torch
# from mobilefacenet import MobileFaceNet

# model = MobileFaceNet()

# state = torch.load(
#     "models/mobilefacenet.pt",
#     map_location="cpu"
# )

# model.load_state_dict(state)

# model.eval()

# print("loaded")

# dummy = torch.randn(
#     1,
#     3,
#     112,
#     112
# )

# with torch.no_grad():
#     out = model(dummy)

# print(out.shape)
# test_embedding.py

# import cv2

# from recognize import get_embedding

# img = cv2.imread("faces/EMP001/1.jpg")

# emb = get_embedding(img)

# print(emb.shape)

import numpy as np

x = np.load("database/1.npy", allow_pickle=True)

print(type(x))
print(x.shape)
print(x.dtype)
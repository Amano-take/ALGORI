import time
import numpy as np

start = time.time()
for _ in range(1000):
    a = np.arange(54).repeat(2)
    b = np.array([0, 1, 2, 4, 4, 7, 9, 9, 6, 6, 53, 13, 35, 13, 19, 10, 17, 26, 16, 39, 30, 0, 50, 37, 17])
    for delete in b:
        a = np.delete(a, np.where(a==delete)[0])
end = time.time()
print(a)
print(end - start)

a = np.arange(54).repeat(2)
start = time.time()
ua, countsa = np.unique(a, return_counts=True)
for _ in range(1000):
    a = np.arange(54).repeat(2)
    b = np.array([0, 1, 2, 4, 4, 7, 9, 9, 6, 6, 53, 13, 35, 13, 19, 10, 17, 26, 16, 39, 30, 0, 50, 37, 17])
    u, counts = np.unique(b, return_counts=True)
    ainb = np.where(np.in1d(ua, b))[0]
    cc = countsa.copy()
    cc[ainb] -= counts
    a = np.repeat(ua, cc)
print(a)
end = time.time()
print(end - start)
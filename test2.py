import numpy as np
import time

a = np.array([0, 1, 0, 2, 3])
b = np.arange(5, dtype=np.int8)
print(np.repeat(b, a))
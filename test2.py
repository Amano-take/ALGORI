import numpy as np
import time

a = np.array([[0, 1, 0, 2, 3], [1, 2, 3, 4, 5]])
print(np.repeat(a[np.newaxis, ::], repeats=2, axis=0))

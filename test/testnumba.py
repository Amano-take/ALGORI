from numba import njit, jit
import numpy as np
import time

class TestClass:
    def __init__(self, n):
        self.x = np.arange(n)

    def double(self):
        for _ in range(1000):
            self.x *= 2
            self.x %= 10**9 + 7
        
    def double2(self):
        self.__double2(self.x)
        
    @staticmethod
    @njit(cache = True)
    def __double2(arr):
        for _ in range(1000):
            arr *= 2
            arr %= 10**9 + 7

    def resetar(self):
        self.x = np.arange(len(self.x))
        
cl = TestClass(10**6)
start = time.time()
cl.double()
print(time.time() - start)
print(cl.x[:10])
cl.resetar()
start = time.time()
cl.double2()
print(time.time() - start)
print(cl.x[:10])
print(np.__config__.show())
import time
import numpy as np

class fint():
    def __init__(self, n) -> None:
        self.n = n
    def __eq__(self, __value: object) -> bool:
        if not isinstance(__value, fint):
            return False
        else:
            return self.n == __value.n
        
    def __ne__(self, __value: object) -> bool:
        return not self.__eq__(__value)
    
    def __lt__(self, other):
        if not isinstance(other, fint):
            return NotImplemented
        return self.n < other.n

    def __ne__(self, other):
        return not self.__eq__(other)

    def __le__(self, other):
        return self.__lt__(other) or self.__eq__(other)

    def __gt__(self, other):
        return not self.__le__(other)

    def __ge__(self, other):
        return not self.__lt__(other)

    def getnumber(self):
        return int(self.num)
        
start = time.time()
for _ in range(1000):
    a = np.arange(54).repeat(2)
    b = np.array([0, 1, 2])
    for delete in b:
        a = np.delete(a, np.where(a==delete)[0])
aa, ac= np.unique(np.array([6, 7, 4, 55, 52, 29, 34, 26, 33, 31, 34, 28, 35, 38, 38, 25, 16, 18, 14, 40, 40, 46, 46, 47, 8, 6, 32, 35, 30, 43, 48, 47, 51, 52, 42, 29, 33, 36, 23, 10, 23, 15, 14, 13, 17, 18, 5, 2, 0, 7, 4, 55, 53, 28, 31, 53, 8, 1, 5, 12, 11, 55, 53, 41, 45, 32, 19, 22, 20, 20, 25, 21, 24, 11, 9, 3, 52, 39, 48, 41, 42, 44, 51, 43, 45, 49, 10, 52, 24, 15, 2]), return_counts=True)
print(aa)
print(ac)
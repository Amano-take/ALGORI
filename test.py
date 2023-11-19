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
end = time.time()
print(a)
print(end - start)

a = np.array([fint(i) for i in range(54)])
start = time.time()
b = np.array([fint(0), fint(53)])
ua, countsa = np.unique(a, return_counts=True)
u, counts = np.unique(b, return_counts=True)
ainb = np.where(np.isin(ua, b))[0]
print(ainb)
cc = countsa.copy()
cc[ainb] -= counts
a = np.repeat(ua, cc)
end = time.time()
print(end - start)
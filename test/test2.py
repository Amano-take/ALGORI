from collections import defaultdict as ddict

a = ddict(int)
for i in range(10):
    if i not in a:
        a[i] = 0
for i in range(10):
    if i not in a:
        a[i] = 100
print(a)

b = None, None
if b is None:
    print("b is None")
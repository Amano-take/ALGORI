import numpy as np
import time

Cards = np.zeros(56, np.int8)
Cards[[1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 10, 11, 12]] += 1

cscore = 0
#色のスコア
for i in range(4):
    cscore += np.any(Cards[i*13: (i+1) * 13] > 0)
#数のスコア
nscore = 0
for i in range(13):
    nscore += np.any(Cards[i: i + 40: 13])
#wildスコア
wscore = np.sum(Cards[52:])
print(cscore, wscore, nscore)

import numpy as np
import tqdm

from Game import Master

iteration = 1000

initprobability = np.zeros((4, 54, ))

for i in tqdm(range(iteration)):

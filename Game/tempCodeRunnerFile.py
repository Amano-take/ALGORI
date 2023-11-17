def __init__(self, level = logging.WARN) -> None:
        self.level = level
        logging.basicConfig(level=level, format="%(message)s")
        self.num2Card = np.frompyfunc(lambda x: Card(x), 1, 1)
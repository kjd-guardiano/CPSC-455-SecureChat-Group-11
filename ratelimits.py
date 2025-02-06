import asyncio
import math
import time
from contextlib import asynccontextmanager

#bucket-based rate limiter (For SocketIO functions)
class SocketIO_Limiter:
    def __init__(self, rate, capacity) -> None:
        self.capacity = capacity
        self.tokens = capacity
        self.rate = rate
        self.last_check = time.time()

    #func for limiting, takes 1 token
    def allow_request(self, amount=1):
        current_time = time.time()
        passed_time = current_time - self.last_check
        self.last_check = current_time #updates time checked

        self.tokens += passed_time * self.rate
        if self.tokens > self.capacity:
            self.tokens = self.capacity

        if self.tokens >= amount:
            self.tokens -= amount
            print("All good!")
            return True
        else:
            print("Rate limiting enabled!")
            return False
import pThrottle from "p-throttle";

const throttle = pThrottle({
  limit: 5, // 5 requests
  interval: 1000, // per second
});

export const throttledFetch = throttle(
  async (url: string, init?: RequestInit) => {
    const res = await fetch(url, init);

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get("Retry-After") || "5");
      console.warn(`[throttle] Rate limited, waiting ${retryAfter}s...`);
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      return fetch(url, init);
    }

    return res;
  }
);

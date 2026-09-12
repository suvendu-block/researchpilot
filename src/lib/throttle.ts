import pThrottle from "p-throttle";

// rate limiter — max 5 requests per second to OpenAlex
// this is important because OpenAlex will rate limit us otherwise,
// and 5 req/s is more than enough for what we're doing

const throttle = pThrottle({
  limit: 5, // 5 requests
  interval: 1000, // per second
});

export const throttledFetch = throttle(
  async (url: string, init?: RequestInit) => {
    const res = await fetch(url, init);

    // if we still get rate limited, respect the Retry-After header
    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get("Retry-After") || "5");
      console.warn(`[throttle] Rate limited, waiting ${retryAfter}s...`);
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      return fetch(url, init);
    }

    return res;
  }
);

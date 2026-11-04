/**
 * Runs a synchronous computation and returns its outcome as a promise, so the in-memory
 * implementations keep the asynchronous contract of their interfaces: a throw becomes a rejection,
 * exactly as it would inside an `async` function, and callers can `.catch()` as well as `await`.
 */
export function settle<T>(compute: () => T): Promise<T> {
  return new Promise((resolve) => {
    resolve(compute());
  });
}

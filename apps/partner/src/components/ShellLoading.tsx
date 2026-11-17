/** What the server renders in place of the client-only shell, and what shows while it loads. */
export function ShellLoading() {
  return (
    <div role="status" className="text-muted flex min-h-dvh items-center justify-center text-sm">
      Loading…
    </div>
  );
}

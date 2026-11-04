/** Marks the legal and about pages as placeholders until the founder supplies the final text. */
export function DraftNotice() {
  return (
    <p
      role="note"
      className="border-accent bg-surface-2 mb-8 rounded-md border-l-4 px-4 py-3 text-sm"
    >
      <strong className="font-semibold">Draft.</strong> This page is a placeholder and will be
      replaced before launch.
    </p>
  );
}

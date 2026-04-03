export default function GlobalLoading() {
  return (
    <main className="mx-auto flex min-h-[40vh] w-full max-w-[760px] items-center justify-center px-4 py-10">
      <div className="inline-flex items-center gap-3 rounded-xl border border-gray-800 bg-[#111111] px-4 py-3 shadow-soft">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
        <span className="text-sm text-gray-400">Loading page...</span>
      </div>
    </main>
  );
}

export default function AuthLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
        <div className="skeleton h-7 w-60 rounded-md" />
        <div className="skeleton mt-3 h-4 w-72 rounded-md" />
        <div className="skeleton mt-6 h-10 w-full rounded-lg" />
        <div className="skeleton mt-3 h-10 w-full rounded-lg" />
        <div className="skeleton mt-4 h-10 w-full rounded-lg" />
      </div>
    </main>
  );
}

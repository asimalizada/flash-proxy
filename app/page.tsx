export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <section className="w-full max-w-2xl rounded-lg border bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wider text-violet-600">
          FlashProxy
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-950">
          Reseller Dashboard
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          Next.js application initialized. Product flows, API key sessions, and
          audit logging will be added in the next slices.
        </p>
      </section>
    </main>
  );
}

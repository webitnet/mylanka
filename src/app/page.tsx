export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="max-w-xl text-center">
        <p className="font-[family-name:var(--font-ui)] text-xs uppercase tracking-[0.25em] text-muted">
          Handmade · Україна · Сувеніри
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl text-bark sm:text-5xl">
          Рідне
        </h1>
        <p className="mt-6 text-base text-ink/80">
          Handmade Ukrainian souvenirs — ceramics, textiles, woodwork, jewelry,
          and regional gifts. Coming soon.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <button className="rounded-sm bg-terracotta px-5 py-2.5 font-[family-name:var(--font-ui)] text-xs uppercase tracking-wider text-cream transition hover:opacity-90">
            Browse catalog
          </button>
          <button className="rounded-sm border border-bark px-5 py-2.5 font-[family-name:var(--font-ui)] text-xs uppercase tracking-wider text-bark transition hover:bg-bark hover:text-cream">
            Our story
          </button>
        </div>
      </div>
    </main>
  );
}

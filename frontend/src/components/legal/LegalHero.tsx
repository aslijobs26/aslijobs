type LegalHeroProps = {
  title: string;
  lastUpdated: string;
};

export function LegalHero({ title, lastUpdated }: LegalHeroProps) {
  return (
    <section className="relative overflow-hidden bg-legal-hero-surface">
      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8 lg:py-24 xl:px-10">
        <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p className="mt-5 text-xs text-muted sm:mt-6 md:text-base">
          Last Updated: {lastUpdated}
        </p>
      </div>
    </section>
  );
}

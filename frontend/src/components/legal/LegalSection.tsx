import type { LegalBlock } from "@/types/legal";

type LegalSectionProps = {
  id: string;
  title: string | null;
  blocks: LegalBlock[];
};

function LegalBlockContent({ block }: { block: LegalBlock }) {
  if (block.type === "paragraph") {
    return (
      <p className="w-full text-sm leading-6 text-muted md:text-base md:leading-8 [&_a]:text-primary [&_a]:underline-offset-2 [&_a]:transition-colors [&_a]:hover:underline">
        {block.text}
      </p>
    );
  }

  if (block.type === "list") {
    return (
      <ul className="w-full list-disc space-y-2 pl-5 text-sm leading-6 text-muted md:text-base md:leading-8 [&_a]:text-primary [&_a]:underline-offset-2 [&_a]:transition-colors [&_a]:hover:underline">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  return (
    <div className="w-full space-y-1 rounded-lg border border-border/50 bg-hero-bg/40 px-4 py-3 text-sm leading-6 text-foreground md:text-base md:leading-8">
      {block.lines.map((line) => (
        <p key={line} className="font-medium">
          {line}
        </p>
      ))}
    </div>
  );
}

export function LegalSection({ id, title, blocks }: LegalSectionProps) {
  return (
    <section
      id={id}
      className="scroll-mt-28 space-y-5 border-b-2 border-border py-8 last:border-b-0 last:pb-0 sm:scroll-mt-32 sm:space-y-6 sm:py-10"
    >
      {title ? (
        <h2 className="text-xl font-bold tracking-tight text-foreground md:text-[1.75rem]">
          {title}
        </h2>
      ) : null}
      <div className="space-y-4 sm:space-y-5">
        {blocks.map((block, index) => (
          <LegalBlockContent
            key={`${id}-${block.type}-${index}`}
            block={block}
          />
        ))}
      </div>
    </section>
  );
}

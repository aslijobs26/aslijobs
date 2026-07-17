import type { LegalBlock } from "@/types/legal";

type LegalSectionProps = {
  id: string;
  title: string | null;
  blocks: LegalBlock[];
};

function ContactLine({ line }: { line: string }) {
  const separatorIndex = line.indexOf(":");

  if (separatorIndex === -1) {
    return (
      <p className="text-base font-bold tracking-tight text-primary md:text-lg">
        {line}
      </p>
    );
  }

  const label = line.slice(0, separatorIndex).trim();
  const value = line.slice(separatorIndex + 1).trim();
  const isEmail = value.includes("@");
  const isUrl =
    value.startsWith("http://") || value.startsWith("https://");

  return (
    <p className="grid gap-0.5 sm:grid-cols-[minmax(10rem,13.5rem)_minmax(0,1fr)] sm:gap-x-3 sm:gap-y-0">
      <span className="font-semibold text-foreground">{label}:</span>
      {isEmail ? (
        <a
          href={`mailto:${value}`}
          className="min-w-0 break-words font-normal text-primary underline-offset-2 transition-colors hover:underline"
        >
          {value}
        </a>
      ) : isUrl ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 break-words font-normal text-primary underline-offset-2 transition-colors hover:underline"
        >
          {value}
        </a>
      ) : (
        <span className="min-w-0 break-words font-normal text-muted">
          {value}
        </span>
      )}
    </p>
  );
}

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
    <div className="w-full space-y-3 rounded-lg border border-primary/15 bg-primary-light px-4 py-4 text-sm leading-6 md:space-y-3.5 md:px-5 md:py-5 md:text-base md:leading-7">
      {block.lines.map((line) => (
        <ContactLine key={line} line={line} />
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

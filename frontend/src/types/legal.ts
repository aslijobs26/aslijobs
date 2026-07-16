export type LegalBlock =
  | {
      type: "paragraph";
      text: string;
    }
  | {
      type: "list";
      items: string[];
    }
  | {
      type: "contact-lines";
      lines: string[];
    };

export type LegalSection = {
  id: string;
  navLabel: string;
  title: string | null;
  blocks: LegalBlock[];
};

export type LegalDocumentMeta = {
  title: string;
  effectiveDate: string;
  lastUpdated: string;
};

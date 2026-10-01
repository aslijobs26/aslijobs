import type { MessageKey } from "@/i18n/translate";

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

export type LegalParagraphSectionSource = {
  id: string;
  navLabelKey: MessageKey;
  titleKey: MessageKey;
  paragraphKeys: readonly MessageKey[];
};

export type LegalKeyedBlockSource =
  | {
      type: "paragraph";
      key: MessageKey;
    }
  | {
      type: "list";
      keys: readonly MessageKey[];
    }
  | {
      type: "contact-lines";
      keys: readonly MessageKey[];
    };

export type LegalKeyedSectionSource = {
  id: string;
  navLabelKey: MessageKey;
  titleKey?: MessageKey;
  blocks: readonly LegalKeyedBlockSource[];
};

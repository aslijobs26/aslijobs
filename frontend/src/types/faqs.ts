import type { MessageKey } from "@/i18n/translate";

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type FaqCategory = {
  id: string;
  title: string;
  items: FaqItem[];
};

export type FaqItemDefinition = {
  id: string;
  questionKey: MessageKey;
  answerKey: MessageKey;
};

export type FaqCategoryDefinition = {
  id: string;
  titleKey: MessageKey;
  items: FaqItemDefinition[];
};

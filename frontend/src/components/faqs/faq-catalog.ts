import { FAQ_CATEGORIES } from "@/constants/faqs";
import type { MessageKey } from "@/i18n/translate";
import type { FaqCategory } from "@/types/faqs";

export function localizeFaqCategories(
  translateFaq: (key: MessageKey) => string,
): FaqCategory[] {
  return FAQ_CATEGORIES.map((category) => ({
    id: category.id,
    title: translateFaq(category.titleKey),
    items: category.items.map((item) => ({
      id: item.id,
      question: translateFaq(item.questionKey),
      answer: translateFaq(item.answerKey),
    })),
  }));
}

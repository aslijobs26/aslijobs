import { HELP_CENTER_CATEGORIES } from "@/constants/help-center";
import { helpCenterBundle } from "@/i18n/bundles/help-center";
import { toCamelCaseId } from "@/i18n/localize-copy";
import type { SiteLanguageCode } from "@/constants/site-language";
import type { HelpCenterCategory } from "@/types/help-center";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function localizeHelpCategories(
  language: SiteLanguageCode,
): HelpCenterCategory[] {
  const categories = helpCenterBundle[language].helpCenter.categories as Record<
    string,
    unknown
  >;

  return HELP_CENTER_CATEGORIES.map((category) => {
    const categoryCopy = categories[toCamelCaseId(category.id)];
    if (!isRecord(categoryCopy) || !isRecord(categoryCopy.articles)) {
      return category;
    }

    const articles = categoryCopy.articles;

    return {
      ...category,
      title:
        typeof categoryCopy.title === "string" ? categoryCopy.title : category.title,
      description:
        typeof categoryCopy.description === "string"
          ? categoryCopy.description
          : category.description,
      cardTitle:
        typeof categoryCopy.cardTitle === "string"
          ? categoryCopy.cardTitle
          : category.cardTitle,
      cardDescription:
        typeof categoryCopy.cardDescription === "string"
          ? categoryCopy.cardDescription
          : category.cardDescription,
      articles: category.articles.map((article) => {
        const articleCopy = articles[toCamelCaseId(article.id)];
        if (!isRecord(articleCopy)) {
          return article;
        }

        return {
          ...article,
          question:
            typeof articleCopy.question === "string"
              ? articleCopy.question
              : article.question,
          answer:
            typeof articleCopy.answer === "string"
              ? articleCopy.answer
              : article.answer,
        };
      }),
    };
  });
}

export type HelpCenterArticle = {
  id: string;
  question: string;
  answer: string;
};

export type HelpCenterCategory = {
  id: string;
  title: string;
  description: string;
  cardTitle: string;
  cardDescription: string;
  articles: HelpCenterArticle[];
};

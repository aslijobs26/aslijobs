export type HomeStatIconKey =
  | "user"
  | "clipboard"
  | "handshake"
  | "shield"
  | "star";

export type HomeStat = {
  id: string;
  value: string;
  label: string;
  icon: HomeStatIconKey;
};

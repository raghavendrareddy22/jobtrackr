export const STAGES = [
  { id: "wishlist", label: "Wishlist" },
  { id: "applied", label: "Applied" },
  { id: "interviewing", label: "Interviewing" },
  { id: "offer", label: "Offer" },
  { id: "rejected", label: "Rejected" },
] as const;

export type StageId = (typeof STAGES)[number]["id"];

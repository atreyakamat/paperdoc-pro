export const lifeCategories = [
  "Identity",
  "Education",
  "Health",
  "Finance",
  "Property",
  "Travel",
  "Work",
] as const;

export const usageContexts = [
  "Banking",
  "Job",
  "Tax",
  "KYC",
  "Government Services",
  "College",
  "Insurance",
  "Hospital",
  "Travel Booking",
  "Property Registration",
] as const;

export const sharingPurposes = [
  "Bank",
  "College",
  "HR",
  "Hospital",
  "Insurance",
  "Government Office",
] as const;

export type LifeCategory = (typeof lifeCategories)[number];
export type UsageContext = (typeof usageContexts)[number];
export type SharingPurpose = (typeof sharingPurposes)[number];

import {
  lifeCategories,
  type LifeCategory,
  sharingPurposes,
  type SharingPurpose,
  usageContexts,
  type UsageContext,
} from "@/lib/constants";

export { lifeCategories, sharingPurposes, usageContexts };
export type { LifeCategory, SharingPurpose, UsageContext };

export type DocumentItem = {
  id: string;
  name: string;
  category: LifeCategory;
  owner: "Self" | "Family";
  issueDate?: string;
  expiryDate?: string;
  usedFor: UsageContext[];
  notes: string;
  createdAt: string;
};

export type ShareLink = {
  id: string;
  documentId: string;
  purpose: SharingPurpose;
  expiresAt: string;
  revoked: boolean;
  watermarkText: string;
  createdAt: string;
};

export type FamilyMember = {
  id: string;
  name: string;
  relation: string;
  role: "Viewer" | "Editor";
  emergencyAccess: boolean;
};

export type Reminder = {
  documentId: string;
  documentName: string;
  category: LifeCategory;
  daysLeft: number;
  severity: "critical" | "warning" | "upcoming";
};

export const reminderWindowDays = 90;

export const getReminders = (documents: DocumentItem[]): Reminder[] => {
  const today = new Date();

  return documents
    .filter((doc) => doc.expiryDate)
    .map((doc) => {
      const expiry = new Date(doc.expiryDate as string);
      const timeDiff = expiry.getTime() - today.getTime();
      const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      let severity: Reminder["severity"] = "upcoming";
      if (daysLeft <= 14) {
        severity = "critical";
      } else if (daysLeft <= 45) {
        severity = "warning";
      }

      return {
        documentId: doc.id,
        documentName: doc.name,
        category: doc.category,
        daysLeft,
        severity,
      };
    })
    .filter((item) => item.daysLeft <= reminderWindowDays)
    .sort((a, b) => a.daysLeft - b.daysLeft);
};

export const getUsageIndex = (documents: DocumentItem[]) => {
  const usageMap = new Map<UsageContext, string[]>();

  usageContexts.forEach((context) => usageMap.set(context, []));

  documents.forEach((doc) => {
    doc.usedFor.forEach((context) => {
      const existing = usageMap.get(context) ?? [];
      usageMap.set(context, [...existing, doc.name]);
    });
  });

  return usageMap;
};

export const getCategoryBreakdown = (documents: DocumentItem[]) => {
  return lifeCategories.map((category) => ({
    category,
    count: documents.filter((doc) => doc.category === category).length,
  }));
};

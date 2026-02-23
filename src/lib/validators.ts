import { z } from "zod";
import { lifeCategories, sharingPurposes, usageContexts } from "@/lib/constants";

export const registerSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const documentSchema = z.object({
  name: z.string().trim().min(2),
  category: z.enum(lifeCategories),
  owner: z.enum(["Self", "Family"]),
  issueDate: z.string().date().optional().or(z.literal("")),
  expiryDate: z.string().date().optional().or(z.literal("")),
  notes: z.string().max(500).optional().default(""),
  usedFor: z.array(z.enum(usageContexts)).min(1),
});

export const familyMemberSchema = z.object({
  name: z.string().trim().min(2),
  relation: z.string().trim().min(2),
});

export const familyPatchSchema = z.object({
  role: z.enum(["Viewer", "Editor"]).optional(),
  emergencyAccess: z.boolean().optional(),
});

export const shareCreateSchema = z.object({
  documentId: z.string().min(1),
  purpose: z.enum(sharingPurposes),
});

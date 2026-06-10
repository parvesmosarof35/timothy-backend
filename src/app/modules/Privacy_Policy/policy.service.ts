import prisma from "../../../shared/prisma";
import { IPrivacyPolicy } from "./policy.interface";
import { cacheManager } from "../../utils/cache";

// Dummy / Fallback Privacy Policy
const dummyPolicyContent =
  "At Fasifys, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal information.";

// Create or update privacy policy
const createOrUpdatePolicy = async (
  adminId: string,
  payload: IPrivacyPolicy
): Promise<string> => {
  // Delete ALL existing records (including any old-schema documents)
  // and create a fresh one with the new simplified schema
  const result = await prisma.$transaction(async (tx) => {
    // Use raw delete to bypass schema validation on old documents
    await (tx.privacy_Policy as any).deleteMany({});

    const created = await tx.privacy_Policy.create({
      data: {
        content: payload.content,
        adminId,
      },
    });
    return created.content;
  });

  // Invalidate cache
  cacheManager.del("privacy_policies:first");

  return result;
};

// Get privacy policy - handles old-schema documents gracefully
const getPolicy = async (): Promise<string> => {
  const cacheKey = "privacy_policies:first";
  const cachedData = cacheManager.get<string>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    // Use runCommandRaw to safely query MongoDB without Prisma type enforcement
    const raw = await (prisma as any).$runCommandRaw({
      find: "privacy_policies",
      limit: 1,
    });

    const doc = raw?.cursor?.firstBatch?.[0];

    if (!doc) {
      cacheManager.set(cacheKey, dummyPolicyContent);
      return dummyPolicyContent;
    }

    // If document has new 'content' field, return it directly
    if (typeof doc.content === "string" && doc.content.length > 0) {
      cacheManager.set(cacheKey, doc.content);
      return doc.content;
    }

    // Document exists but is old-schema (no content field) - return dummy
    cacheManager.set(cacheKey, dummyPolicyContent);
    return dummyPolicyContent;
  } catch {
    // Fallback on any DB error
    return dummyPolicyContent;
  }
};

export const PrivacyServices = {
  createOrUpdatePolicy,
  getPolicy,
};

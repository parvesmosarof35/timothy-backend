import prisma from "../../../shared/prisma";
import { IPrivacyPolicy } from "./policy.interface";
import { cacheManager } from "../../utils/cache";

// Dummy / Fallback Privacy Policy
const dummyPolicyContent =
  "At Fasifys, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal information.";

// Create or update privacy policy - uses raw MongoDB commands to bypass Prisma client schema validation
const createOrUpdatePolicy = async (
  adminId: string,
  payload: IPrivacyPolicy
): Promise<string> => {
  const now = new Date().toISOString();

  // Use raw MongoDB commands — works regardless of Prisma client schema version on server
  await (prisma as any).$runCommandRaw({
    delete: "privacy_policies",
    deletes: [{ q: {}, limit: 0 }], // delete all existing documents
  });

  await (prisma as any).$runCommandRaw({
    insert: "privacy_policies",
    documents: [
      {
        content: payload.content,
        adminId,
        createdAt: { $date: now },
        updatedAt: { $date: now },
      },
    ],
  });

  // Invalidate cache
  cacheManager.del("privacy_policies:first");

  return payload.content;
};

// Get privacy policy - uses raw MongoDB to avoid Prisma type enforcement on old documents
const getPolicy = async (): Promise<string> => {
  const cacheKey = "privacy_policies:first";
  const cachedData = cacheManager.get<string>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
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
    return dummyPolicyContent;
  }
};

export const PrivacyServices = {
  createOrUpdatePolicy,
  getPolicy,
};

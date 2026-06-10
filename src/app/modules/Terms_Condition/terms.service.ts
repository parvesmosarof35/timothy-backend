import prisma from "../../../shared/prisma";
import { ICreateTermsCondition } from "./terms.interface";
import { cacheManager } from "../../utils/cache";

// Dummy / Fallback Terms and Conditions
const dummyTermsContent =
  "Welcome to Fasifys. By accessing or using our services, you agree to be bound by these terms. If you do not agree, please do not use our services.";

// Create or update terms & conditions - uses raw MongoDB commands to bypass Prisma client schema validation
const createOrUpdateTerms = async (
  adminId: string,
  payload: ICreateTermsCondition
): Promise<string> => {
  const now = new Date().toISOString();

  // Use raw MongoDB commands — works regardless of Prisma client schema version on server
  await (prisma as any).$runCommandRaw({
    delete: "terms_conditions",
    deletes: [{ q: {}, limit: 0 }], // delete all existing documents
  });

  await (prisma as any).$runCommandRaw({
    insert: "terms_conditions",
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
  cacheManager.del("terms_conditions:first");

  return payload.content;
};

// Get terms and conditions - uses raw MongoDB to avoid Prisma type enforcement on old documents
const getTerms = async (): Promise<string> => {
  const cacheKey = "terms_conditions:first";
  const cachedData = cacheManager.get<string>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const raw = await (prisma as any).$runCommandRaw({
      find: "terms_conditions",
      limit: 1,
    });

    const doc = raw?.cursor?.firstBatch?.[0];

    if (!doc) {
      cacheManager.set(cacheKey, dummyTermsContent);
      return dummyTermsContent;
    }

    // If document has new 'content' field, return it directly
    if (typeof doc.content === "string" && doc.content.length > 0) {
      cacheManager.set(cacheKey, doc.content);
      return doc.content;
    }

    // Document exists but is old-schema (no content field) - return dummy
    cacheManager.set(cacheKey, dummyTermsContent);
    return dummyTermsContent;
  } catch {
    return dummyTermsContent;
  }
};

export const TermsServices = {
  createOrUpdateTerms,
  getTerms,
};

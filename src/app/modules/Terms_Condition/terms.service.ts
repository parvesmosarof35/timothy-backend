import prisma from "../../../shared/prisma";
import { ICreateTermsCondition } from "./terms.interface";
import { cacheManager } from "../../utils/cache";

// Dummy / Fallback Terms and Conditions
const dummyTermsContent =
  "Welcome to Fasifys. By accessing or using our services, you agree to be bound by these terms. If you do not agree, please do not use our services.";

// Create or update terms & conditions
const createOrUpdateTerms = async (
  adminId: string,
  payload: ICreateTermsCondition
): Promise<string> => {
  // Delete ALL existing records (including any old-schema documents)
  // and create a fresh one with the new simplified schema
  const result = await prisma.$transaction(async (tx) => {
    // Use raw delete to bypass schema validation on old documents
    await (tx.terms_Condition as any).deleteMany({});

    const created = await tx.terms_Condition.create({
      data: {
        content: payload.content,
        adminId,
      },
    });
    return created.content;
  });

  // Invalidate cache
  cacheManager.del("terms_conditions:first");

  return result;
};

// Get terms and conditions - handles old-schema documents gracefully
const getTerms = async (): Promise<string> => {
  const cacheKey = "terms_conditions:first";
  const cachedData = cacheManager.get<string>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    // Use runCommandRaw to safely query MongoDB without Prisma type enforcement
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
    // Fallback on any DB error
    return dummyTermsContent;
  }
};

export const TermsServices = {
  createOrUpdateTerms,
  getTerms,
};

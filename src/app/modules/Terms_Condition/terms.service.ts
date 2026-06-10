import prisma from "../../../shared/prisma";
import { ICreateTermsCondition } from "./terms.interface";
import { cacheManager } from "../../utils/cache";

// Dummy / Fallback Terms and Conditions
const dummyTermsContent = "Welcome to Fasifys. By accessing or using our services, you agree to be bound by these terms. If you do not agree, please do not use our services.";

// Create or update terms & conditions
const createOrUpdateTerms = async (
  adminId: string,
  payload: ICreateTermsCondition
): Promise<string> => {
  const result = await prisma.$transaction(async (tx) => {
    // Check if there is an existing terms & conditions entry
    const existingTerms = await tx.terms_Condition.findFirst();

    if (existingTerms) {
      // Update the existing entry
      const updated = await tx.terms_Condition.update({
        where: { id: existingTerms.id },
        data: {
          content: payload.content,
          adminId,
        },
      });
      return updated.content;
    } else {
      // Create a new entry
      const created = await tx.terms_Condition.create({
        data: {
          content: payload.content,
          adminId,
        },
      });
      return created.content;
    }
  });

  // Invalidate cache
  cacheManager.del("terms_conditions:first");

  return result;
};

// Get terms and conditions
const getTerms = async (): Promise<string> => {
  const cacheKey = "terms_conditions:first";
  const cachedData = cacheManager.get<string>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const result = await prisma.terms_Condition.findFirst();

  if (!result) {
    // Cache the dummy terms for subsequent requests
    cacheManager.set(cacheKey, dummyTermsContent);
    return dummyTermsContent;
  }

  cacheManager.set(cacheKey, result.content);
  return result.content;
};

export const TermsServices = {
  createOrUpdateTerms,
  getTerms,
};

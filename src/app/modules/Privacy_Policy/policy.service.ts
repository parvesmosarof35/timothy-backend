import prisma from "../../../shared/prisma";
import { IPrivacyPolicy } from "./policy.interface";
import { cacheManager } from "../../utils/cache";

// Dummy / Fallback Privacy Policy
const dummyPolicyContent = "At Fasifys, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal information.";

// Create or update privacy policy
const createOrUpdatePolicy = async (
  adminId: string,
  payload: IPrivacyPolicy
): Promise<string> => {
  const result = await prisma.$transaction(async (tx) => {
    // Check if there is an existing policy entry
    const existingPolicy = await tx.privacy_Policy.findFirst();

    if (existingPolicy) {
      // Update the existing entry
      const updated = await tx.privacy_Policy.update({
        where: { id: existingPolicy.id },
        data: {
          content: payload.content,
          adminId,
        },
      });
      return updated.content;
    } else {
      // Create a new entry
      const created = await tx.privacy_Policy.create({
        data: {
          content: payload.content,
          adminId,
        },
      });
      return created.content;
    }
  });

  // Invalidate cache
  cacheManager.del("privacy_policies:first");

  return result;
};

// Get privacy policy
const getPolicy = async (): Promise<string> => {
  const cacheKey = "privacy_policies:first";
  const cachedData = cacheManager.get<string>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const result = await prisma.privacy_Policy.findFirst();

  if (!result) {
    // Cache the dummy policy for subsequent requests
    cacheManager.set(cacheKey, dummyPolicyContent);
    return dummyPolicyContent;
  }

  cacheManager.set(cacheKey, result.content);
  return result.content;
};

export const PrivacyServices = {
  createOrUpdatePolicy,
  getPolicy,
};

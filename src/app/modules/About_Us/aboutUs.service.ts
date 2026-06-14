import prisma from "../../../shared/prisma";
import { IAboutUs } from "./aboutUs.interface";
import { cacheManager } from "../../utils/cache";

// Dummy / Fallback About Us
const dummyAboutUsContent =
  "Welcome to Fasifys. We are dedicated to providing the best service to our users. Our platform offers room bookings, security services, car rentals, and attractions to enhance your travel experience.";

// Create or update about us - uses raw MongoDB commands to bypass Prisma client schema validation
const createOrUpdateAboutUs = async (
  adminId: string,
  payload: IAboutUs
): Promise<string> => {
  const now = new Date().toISOString();

  // Use raw MongoDB commands — works regardless of Prisma client schema version on server
  await (prisma as any).$runCommandRaw({
    delete: "about_us",
    deletes: [{ q: {}, limit: 0 }], // delete all existing documents
  });

  await (prisma as any).$runCommandRaw({
    insert: "about_us",
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
  cacheManager.del("about_us:first");

  return payload.content;
};

// Get about us - uses raw MongoDB to avoid Prisma type enforcement on old documents
const getAboutUs = async (): Promise<string> => {
  const cacheKey = "about_us:first";
  const cachedData = cacheManager.get<string>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const raw = await (prisma as any).$runCommandRaw({
      find: "about_us",
      limit: 1,
    });

    const doc = raw?.cursor?.firstBatch?.[0];

    if (!doc) {
      cacheManager.set(cacheKey, dummyAboutUsContent);
      return dummyAboutUsContent;
    }

    // If document has new 'content' field, return it directly
    if (typeof doc.content === "string" && doc.content.length > 0) {
      cacheManager.set(cacheKey, doc.content);
      return doc.content;
    }

    // Document exists but is old-schema (no content field) - return dummy
    cacheManager.set(cacheKey, dummyAboutUsContent);
    return dummyAboutUsContent;
  } catch {
    return dummyAboutUsContent;
  }
};

export const AboutUsServices = {
  createOrUpdateAboutUs,
  getAboutUs,
};

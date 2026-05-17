import { Terms_Condition } from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import { ICreateTermsCondition } from "./terms.interface";
import { cacheManager } from "../../utils/cache";

// Dummy / Fallback Terms and Conditions to prevent 404 errors
const dummyTerms: Terms_Condition = {
  id: "dummy-terms-id",
  title: "Terms and Conditions",
  acceptance_terms: "Welcome to Fasifys. By accessing or using our services, you agree to be bound by these terms. If you do not agree, please do not use our services.",
  app_purpose: "Fasifys provides a platform to connect users with various booking services, including hotels, security, cars, and attractions.",
  user_responsibilities: "Users must provide accurate information, protect their account credentials, and comply with all applicable local, national, and international laws.",
  data_usage: "We collect and use your data to facilitate bookings, personalize your experience, and improve our services as described in our Privacy Policy.",
  intellectual_property: "All content, logos, trademarks, and software on Fasifys are the property of Fasifys or its licensors and are protected by intellectual property laws.",
  limitation: "Fasifys is not liable for any indirect, incidental, special, or consequential damages arising out of or in connection with the use of our services.",
  updates: "We reserves the right to modify these terms at any time. Changes will be posted on this page, and your continued use constitutes acceptance of the new terms.",
  contactUS: "If you have any questions about these terms, please contact us at support@fasifys.com.",
  adminId: "dummy-admin-id",
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Create terms & conditions
const createTerms = async (
  adminId: string,
  payload: ICreateTermsCondition
): Promise<Omit<Terms_Condition, "adminId">> => {
  const result = await prisma.$transaction(async (tx) => {
    // delete previous terms by this admin
    await tx.terms_Condition.deleteMany({
      where: {
        adminId,
      },
    });

    // then create new terms and conditions
    const newTerms = await tx.terms_Condition.create({
      data: {
        ...payload,
        adminId, // stored but not exposed
      },
      select: {
        id: true,
        title: true,
        acceptance_terms: true,
        app_purpose: true,
        user_responsibilities: true,
        data_usage: true,
        intellectual_property: true,
        limitation: true,
        updates: true,
        contactUS: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return newTerms;
  });

  // Invalidate cache
  cacheManager.del("terms_conditions:first");
  cacheManager.delPattern("terms_conditions:id:*");

  return result;
};

// get all terms
const getTerms = async (): Promise<Omit<Terms_Condition, "adminId"> | null> => {
  const cacheKey = "terms_conditions:first";
  const cachedData = cacheManager.get<Omit<Terms_Condition, "adminId">>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const result = await prisma.terms_Condition.findFirst({
    select: {
      id: true,
      title: true,
      acceptance_terms: true,
      app_purpose: true,
      user_responsibilities: true,
      data_usage: true,
      intellectual_property: true,
      limitation: true,
      updates: true,
      contactUS: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!result) {
    const { adminId, ...termsWithoutAdmin } = dummyTerms;
    // Cache the dummy terms for subsequent requests
    cacheManager.set(cacheKey, termsWithoutAdmin);
    return termsWithoutAdmin;
  }

  cacheManager.set(cacheKey, result);
  return result;
};

// get single terms
const getSingleTerms = async (id: string): Promise<Terms_Condition> => {
  const cacheKey = `terms_conditions:id:${id}`;
  const cachedData = cacheManager.get<Terms_Condition>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const result = await prisma.terms_Condition.findUnique({
    where: { id },
  });
  if (!result) {
    const customizedDummy = { ...dummyTerms, id };
    cacheManager.set(cacheKey, customizedDummy);
    return customizedDummy;
  }
  cacheManager.set(cacheKey, result);
  return result;
};

const updateTermsByAdminId = async (
  adminId: string,
  termId: string,
  payload: Partial<Terms_Condition>
): Promise<Omit<Terms_Condition, "adminId">> => {
  const admin = await prisma.user.findUnique({
    where: {
      id: adminId,
    },
  });
  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, "Admin not found");
  }

  let terms = await prisma.terms_Condition.findUnique({
    where: { id: termId },
  });

  if (!terms && termId === "dummy-terms-id") {
    // If the frontend tries to update the dummy ID but a terms record already exists in DB, update that one
    const existingTerms = await prisma.terms_Condition.findFirst();
    if (existingTerms) {
      terms = existingTerms;
    }
  }

  if (!terms) {
    // Create terms and conditions because they don't exist in the database yet
    const newTerms = await prisma.terms_Condition.create({
      data: {
        title: payload.title || dummyTerms.title,
        acceptance_terms: payload.acceptance_terms || dummyTerms.acceptance_terms,
        app_purpose: payload.app_purpose || dummyTerms.app_purpose,
        user_responsibilities: payload.user_responsibilities || dummyTerms.user_responsibilities,
        data_usage: payload.data_usage || dummyTerms.data_usage,
        intellectual_property: payload.intellectual_property || dummyTerms.intellectual_property,
        limitation: payload.limitation || dummyTerms.limitation,
        updates: payload.updates || dummyTerms.updates,
        contactUS: payload.contactUS || dummyTerms.contactUS,
        adminId,
      },
      select: {
        id: true,
        title: true,
        acceptance_terms: true,
        app_purpose: true,
        user_responsibilities: true,
        data_usage: true,
        intellectual_property: true,
        limitation: true,
        updates: true,
        contactUS: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Invalidate cache
    cacheManager.del("terms_conditions:first");
    cacheManager.delPattern("terms_conditions:id:*");

    return newTerms;
  }

  // terms and condition updated
  const updatedTerms = await prisma.terms_Condition.update({
    where: { id: terms.id },
    data: payload,
    select: {
      id: true,
      title: true,
      acceptance_terms: true,
      app_purpose: true,
      user_responsibilities: true,
      data_usage: true,
      intellectual_property: true,
      limitation: true,
      updates: true,
      contactUS: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Invalidate cache
  cacheManager.del("terms_conditions:first");
  cacheManager.del(`terms_conditions:id:${terms.id}`);
  if (termId !== terms.id) {
    cacheManager.del(`terms_conditions:id:${termId}`);
  }

  return updatedTerms!;
};

export const TermsServices = {
  createTerms,
  getTerms,
  getSingleTerms,
  updateTermsByAdminId,
};

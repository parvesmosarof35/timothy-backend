import prisma from "../../../shared/prisma";
import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import { IPrivacyPolicy } from "./policy.interface";
import { Privacy_Policy } from "@prisma/client";
import { cacheManager } from "../../utils/cache";

// Dummy / Fallback Privacy Policy to prevent 404 errors
const dummyPolicy: Privacy_Policy = {
  id: "dummy-policy-id",
  title: "Privacy Policy",
  introduction: "At Fasifys, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal information.",
  information_collect: [
    "Personal Identification Information (Name, email address, phone number, etc.)",
    "Booking details and transaction history",
    "Device information and IP address"
  ],
  how_useYour_data: [
    "To process and manage your hotel, security, car, or attraction bookings.",
    "To send reservation confirmations and updates.",
    "To improve and customize our application services."
  ],
  data_security: "We implement industry-standard administrative, technical, and physical security measures to protect your personal data against unauthorized access or disclosure.",
  third_party_services: "We may share your data with trusted partners (such as hotel, car rental, or security service providers) solely to facilitate your bookings.",
  user_control: [
    "You have the right to access and receive a copy of your personal data.",
    "You have the right to request rectification of inaccurate personal data.",
    "You have the right to request deletion of your account and personal details."
  ],
  children_privacy: "Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children.",
  changes_to_policy: "We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.",
  contact_info: "If you have any questions or concerns regarding our privacy practices, please contact us at privacy@fasifys.com.",
  adminId: "dummy-admin-id",
  createdAt: new Date(),
  updatedAt: new Date(),
};

// create privacy policy
const createPolicy = async (
  adminId: string,
  payload: IPrivacyPolicy
): Promise<Omit<Privacy_Policy, "adminId"> | null> => {
  const result = await prisma.$transaction(async (tx) => {
    await tx.privacy_Policy.deleteMany({ where: { adminId } });

    const newPolicy = await tx.privacy_Policy.create({
      data: { ...payload, adminId },
      select: {
        id: true,
        title: true,
        introduction: true,
        information_collect: true,
        how_useYour_data: true,
        data_security: true,
        third_party_services: true,
        user_control: true,
        children_privacy: true,
        changes_to_policy: true,
        contact_info: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return newPolicy;
  });

  // Invalidate cache
  cacheManager.del("privacy_policies:first");
  cacheManager.delPattern("privacy_policies:id:*");

  return result;
};

// get all privacy policy
const getAllPolicy = async (): Promise<Omit<
  Privacy_Policy,
  "adminId"
> | null> => {
  const cacheKey = "privacy_policies:first";
  const cachedData = cacheManager.get<Omit<Privacy_Policy, "adminId">>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const policy = await prisma.privacy_Policy.findFirst({
    select: {
      id: true,
      title: true,
      introduction: true,
      information_collect: true,
      how_useYour_data: true,
      data_security: true,
      third_party_services: true,
      user_control: true,
      children_privacy: true,
      changes_to_policy: true,
      contact_info: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!policy) {
    const { adminId, ...policyWithoutAdmin } = dummyPolicy;
    cacheManager.set(cacheKey, policyWithoutAdmin);
    return policyWithoutAdmin;
  }

  cacheManager.set(cacheKey, policy);
  return policy;
};

// get privacy policy by id
const getSinglePolicy = async (id: string): Promise<Privacy_Policy> => {
  const cacheKey = `privacy_policies:id:${id}`;
  const cachedData = cacheManager.get<Privacy_Policy>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const policy = await prisma.privacy_Policy.findUnique({ where: { id } });
  if (!policy) {
    const customizedDummy = { ...dummyPolicy, id };
    cacheManager.set(cacheKey, customizedDummy);
    return customizedDummy;
  }

  cacheManager.set(cacheKey, policy);
  return policy;
};

// update privacy policy
const updatePolicyByAdminId = async (
  adminId: string,
  policyId: string,
  payload: Partial<Privacy_Policy>
): Promise<Omit<Privacy_Policy, "adminId">> => {
  const admin = await prisma.user.findUnique({
    where: {
      id: adminId,
    },
  });
  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, "Admin not found");
  }

  let policy = await prisma.privacy_Policy.findUnique({
    where: {
      id: policyId,
    },
  });

  if (!policy && policyId === "dummy-policy-id") {
    // If the frontend tries to update the dummy ID but a policy already exists in DB, update that one
    const existingPolicy = await prisma.privacy_Policy.findFirst();
    if (existingPolicy) {
      policy = existingPolicy;
    }
  }

  if (!policy) {
    // Create the policy since it does not exist in the database yet
    const newPolicy = await prisma.privacy_Policy.create({
      data: {
        title: payload.title || dummyPolicy.title,
        introduction: payload.introduction || dummyPolicy.introduction,
        information_collect: payload.information_collect || dummyPolicy.information_collect,
        how_useYour_data: payload.how_useYour_data || dummyPolicy.how_useYour_data,
        data_security: payload.data_security || dummyPolicy.data_security,
        third_party_services: payload.third_party_services || dummyPolicy.third_party_services,
        user_control: payload.user_control || dummyPolicy.user_control,
        children_privacy: payload.children_privacy || dummyPolicy.children_privacy,
        changes_to_policy: payload.changes_to_policy || dummyPolicy.changes_to_policy,
        contact_info: payload.contact_info || dummyPolicy.contact_info,
        adminId,
      },
      select: {
        id: true,
        title: true,
        introduction: true,
        information_collect: true,
        how_useYour_data: true,
        data_security: true,
        third_party_services: true,
        user_control: true,
        children_privacy: true,
        changes_to_policy: true,
        contact_info: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Invalidate cache
    cacheManager.del("privacy_policies:first");
    cacheManager.delPattern("privacy_policies:id:*");

    return newPolicy;
  }

  const updated = await prisma.privacy_Policy.update({
    where: { id: policy.id },
    data: payload,
    select: {
      id: true,
      title: true,
      introduction: true,
      information_collect: true,
      how_useYour_data: true,
      data_security: true,
      third_party_services: true,
      user_control: true,
      children_privacy: true,
      changes_to_policy: true,
      contact_info: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Invalidate cache
  cacheManager.del("privacy_policies:first");
  cacheManager.del(`privacy_policies:id:${policy.id}`);
  if (policyId !== policy.id) {
    cacheManager.del(`privacy_policies:id:${policyId}`);
  }

  return updated!;
};

export const PrivacyServices = {
  createPolicy,
  getAllPolicy,
  getSinglePolicy,
  updatePolicyByAdminId,
};

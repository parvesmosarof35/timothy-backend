import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { Request, Response } from "express";
import { PrivacyServices } from "./policy.service";

// Create or update privacy policy
const createOrUpdatePolicy = catchAsync(async (req: Request, res: Response) => {
  const adminId = req.user?.id;
  const { content } = req.body;
  const result = await PrivacyServices.createOrUpdatePolicy(adminId, { content });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Privacy Policy updated successfully",
    data: result,
  });
});

// Get privacy policy
const getPolicy = catchAsync(async (req: Request, res: Response) => {
  const result = await PrivacyServices.getPolicy();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Privacy Policy fetched successfully",
    data: result,
  });
});

export const PrivacyController = {
  createOrUpdatePolicy,
  getPolicy,
};

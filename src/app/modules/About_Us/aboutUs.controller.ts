import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { Request, Response } from "express";
import { AboutUsServices } from "./aboutUs.service";

// Create or update about us
const createOrUpdateAboutUs = catchAsync(async (req: Request, res: Response) => {
  const adminId = req.user?.id;
  const { content } = req.body;
  const result = await AboutUsServices.createOrUpdateAboutUs(adminId, { content });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "About Us updated successfully",
    data: result,
  });
});

// Get about us
const getAboutUs = catchAsync(async (req: Request, res: Response) => {
  const result = await AboutUsServices.getAboutUs();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "About Us fetched successfully",
    data: result,
  });
});

export const AboutUsController = {
  createOrUpdateAboutUs,
  getAboutUs,
};

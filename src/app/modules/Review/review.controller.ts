import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { ReviewService } from "./review.service";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { cacheManager } from "../../utils/cache";

// create hotel review
const createHotelReview = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { roomId, rating, comment } = req.body;

  const result = await ReviewService.createHotelReview(
    userId,
    roomId,
    rating,
    comment
  );

  // Invalidate reviews and hotels cache since this affects ratings
  cacheManager.delPattern("reviews:*");
  cacheManager.delPattern("hotels:*");

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Review created successfully",
    data: result,
  });
});

// create security review
const createSecurityReview = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { security_GuardId, rating, comment } = req.body;

  const result = await ReviewService.createSecurityReview(
    userId,
    security_GuardId,
    rating,
    comment
  );

  // Invalidate reviews cache
  cacheManager.delPattern("reviews:*");

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Review created successfully",
    data: result,
  });
});

// create car review
const createCarReview = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { carId, rating, comment } = req.body;

  const result = await ReviewService.createCarReview(
    userId,
    carId,
    rating,
    comment
  );

  // Invalidate reviews and car rentals cache since this affects car ratings
  cacheManager.delPattern("reviews:*");
  cacheManager.delPattern("car-rentals:*");

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Review created successfully",
    data: result,
  });
});

// create attraction review
const createAttractionReview = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { appealId, rating, comment } = req.body;

    const result = await ReviewService.createAttractionReview(
      userId,
      appealId,
      rating,
      comment
    );

    // Invalidate reviews and attractions cache since this affects attraction ratings
    cacheManager.delPattern("reviews:*");
    cacheManager.delPattern("attractions:*");

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Review created successfully",
      data: result,
    });
  }
);

// get all reviews
const getAllReviews = catchAsync(async (req: Request, res: Response) => {
  const cacheKey = "reviews:all";
  const cachedData = cacheManager.get(cacheKey);

  if (cachedData) {
    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Reviews fetched successfully (from cache)",
      data: cachedData,
    });
  }

  const result = await ReviewService.getAllReviews();
  cacheManager.set(cacheKey, result);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reviews fetched successfully",
    data: result,
  });
});

// get all hotel reviews by hotel id
const getAllHotelReviewsByHotelId = catchAsync(
  async (req: Request, res: Response) => {
    const hotelId = req.params.hotelId;
    const cacheKey = `reviews:hotel:${hotelId}`;
    const cachedData = cacheManager.get(cacheKey);

    if (cachedData) {
      return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Reviews fetched successfully (from cache)",
        data: cachedData,
      });
    }

    const result = await ReviewService.getAllHotelReviewsByHotelId(hotelId);
    cacheManager.set(cacheKey, result);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Reviews fetched successfully",
      data: result,
    });
  }
);

export const ReviewController = {
  createHotelReview,
  createSecurityReview,
  createCarReview,
  createAttractionReview,
  getAllReviews,
  getAllHotelReviewsByHotelId,
};

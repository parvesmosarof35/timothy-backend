import { Request } from "express";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import { uploadFile } from "../../../helpars/fileUploader";
import { ICarRentalFilter } from "./carRental.interface";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { paginationHelpers } from "../../../helpars/paginationHelper";
import { BookingStatus, EveryServiceStatus, Prisma } from "@prisma/client";
import { searchableFields } from "./carRental.constant";
import { CurrencyHelpers } from "../../../helpars/currency";

// create Car Rental
const createCarRental = async (req: Request) => {
  const partnerId = req.user?.id;

  // Check if partner exists
  const partnerExists = await prisma.user.findUnique({
    where: { id: partnerId },
  });
  if (!partnerExists) {
    throw new ApiError(httpStatus.NOT_FOUND, "Partner not found");
  }

  // service check
  if (
    partnerExists.isHotel ||
    partnerExists.isSecurity ||
    partnerExists.isAttraction
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You can only provide one type of service. You already provide another service."
    );
  }

  const files = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };

  const carLogoFile = files?.businessLogo?.[0];
  const carDocsFiles = files?.carDocs || [];

  // Upload logo
  let businessLogo = "https://i.ibb.co/zWxSgQL8/download.png";
  if (carLogoFile) {
    const logoResult = await uploadFile.uploadToCloudinary(carLogoFile);
    businessLogo = logoResult?.secure_url || businessLogo;
  }

  // Upload multiple car docs
  let carDocUrls: string[] = [];
  if (carDocsFiles.length > 0) {
    const docUploads = await Promise.all(
      carDocsFiles.map((file) => uploadFile.uploadToCloudinary(file))
    );
    carDocUrls = docUploads.map((img) => img?.secure_url || "");
  }

  const {
    carBusinessName,
    carName,
    carBusinessType,
    carRegNum,
    carRegDate,
    carPhone,
    carEmail,
    carTagline,
    carRentalDescription,
    carBookingCondition,
    carCancelationPolicy,
  } = req.body;

  const result = await prisma.car_Rental.create({
    data: {
      carBusinessName,
      carName,
      carBusinessType,
      carRegNum,
      carRegDate,
      carPhone,
      carEmail,
      carTagline,
      carRentalDescription,
      carBookingCondition,
      carCancelationPolicy,
      businessLogo,
      carDocs: carDocUrls,
      partnerId,
    },
  });

  // update partner car count
  await prisma.user.update({
    where: { id: partnerExists.id },
    data: { isCar: true },
  });

  return result;
};

// create Car
const createCar = async (req: Request) => {
  const partnerId = req.user?.id;
  const carRentalId = req.params.car_RentalId;

  const partnerExists = await prisma.user.findUnique({
    where: { id: partnerId },
  });
  if (!partnerExists) {
    throw new ApiError(httpStatus.NOT_FOUND, "Partner not found");
  }

  // check if car rental exists and belongs to this partner
  const carRentalExists = await prisma.car_Rental.findFirst({
    where: { id: carRentalId, partnerId },
  });
  if (!carRentalExists) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Car Rental not found or unauthorized"
    );
  }

  const files = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };

  const carImageFiles = files?.carImages || [];

  // Upload multiple car images
  let carImageUrls: string[] = [];
  if (carImageFiles.length > 0) {
    const uploads = await Promise.all(
      carImageFiles.map((file) => uploadFile.uploadToCloudinary(file))
    );
    carImageUrls = uploads.map((img) => img?.secure_url || "");
  }

  const {
    carAddress,
    carPostalCode,
    carDistrict,
    carCity,
    carCountry,
    carDescription,
    carServicesOffered,
    carType,
    carSeats,
    carOilType,
    carEngineType,
    carTransmission,
    carPower,
    carDrivetrain,
    carMileage,
    carModel,
    carCapacity,
    carColor,
    fuelType,
    gearType,
    carRating,
    carPriceDay,
    category,
    discount,
    carReviewCount,
    carBookingAbleDays,
    currency,
  } = req.body;

  const result = await prisma.car.create({
    data: {
      carAddress,
      carPostalCode,
      carDistrict,
      carCity,
      carCountry,
      carDescription,
      carImages: carImageUrls,
      carServicesOffered: Array.isArray(carServicesOffered)
        ? carServicesOffered
        : carServicesOffered?.split(",") || [],
      carType,
      carSeats,
      carOilType,
      carEngineType,
      carTransmission,
      carPower,
      carDrivetrain,
      carMileage,
      carModel,
      carCapacity,
      carColor,
      fuelType,
      gearType,
      carRating: carRating ? carRating : "0",
      carPriceDay: carPriceDay ? parseFloat(carPriceDay) : 0,
      carBookingAbleDays: Array.isArray(carBookingAbleDays)
        ? carBookingAbleDays
        : carBookingAbleDays?.split(",") || [],
      category: category || undefined,
      discount: discount ? parseFloat(discount) : 0,
      carReviewCount: carReviewCount ? parseInt(carReviewCount) : 0,
      partnerId: carRentalExists.partnerId,
      car_RentalId: carRentalExists.id,
      currency: currency.toUpperCase(),
    },
  });

  return result;
};

// get all car active listing by partnerId
const getAllCarActiveListingByPartnerId = async (
  partnerId: string,
  options: IPaginationOptions
) => {
  const { limit, page, skip } = paginationHelpers.calculatedPagination(options);

  const result = await prisma.car.findMany({
    where: {
      partnerId,
    },
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? {
            [options.sortBy]: options.sortOrder,
          }
        : {
            createdAt: "desc",
          },
  });

  const total = await prisma.car.count({
    where: {
      partnerId,
    },
  });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: result,
  };
};

// get all car available by partnerId
const getAllAvailableListingCarByPartnerId = async (
  partnerId: string,
  options: IPaginationOptions
) => {
  const { limit, page, skip } = paginationHelpers.calculatedPagination(options);

  const result = await prisma.car.findMany({
    where: {
      partnerId,
      isBooked: EveryServiceStatus.AVAILABLE,
    },
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? {
            [options.sortBy]: options.sortOrder,
          }
        : {
            createdAt: "desc",
          },
  });

  const total = await prisma.car.count({
    where: {
      partnerId,
    },
  });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: result,
  };
};

// get all car rentals
const getAllCarRentals = async (
  params: ICarRentalFilter,
  options: IPaginationOptions
) => {
  const { limit, page, skip } = paginationHelpers.calculatedPagination(options);

  const { searchTerm, ...filterData } = params;

  const filters: Prisma.Car_RentalWhereInput[] = [];

  // text search
  if (params?.searchTerm) {
    filters.push({
      OR: searchableFields.map((field) => ({
        [field]: {
          contains: params.searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  // Exact search filter
  if (Object.keys(filterData).length > 0) {
    filters.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as any)[key],
        },
      })),
    });
  }

  // get only isBooked  AVAILABLE hotels
  // filters.push({
  //   isBooked: EveryServiceStatus.AVAILABLE,
  // });

  const where: Prisma.Car_RentalWhereInput = { AND: filters };

  const result = await prisma.car_Rental.findMany({
    where,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : {
            createdAt: "desc",
          },
    include: {
      review: true,
    },
  });
  const total = await prisma.car_Rental.count({ where });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: result,
  };
};

// get all car rentals cars
const getAllCarRentalsCars = async (
  params: ICarRentalFilter,
  options: IPaginationOptions,
  userCurrency: string = "USD"
) => {
  const { limit, page, skip } = paginationHelpers.calculatedPagination(options);

  const { searchTerm, fromDate, toDate, ...filterData } = params;

  const filters: Prisma.CarWhereInput[] = [];

  // text search
  if (searchTerm) {
    filters.push({
      OR: searchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  // Exact search filter
  if (Object.keys(filterData).length > 0) {
    filters.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as any)[key],
        },
      })),
    });
  }

  // Availability filter
  if (fromDate && toDate) {
    filters.push({
      car_Booking: {
        none: {
          bookingStatus: BookingStatus.CONFIRMED,
          AND: [
            {
              carBookedFromDate: { lte: toDate },
            },
            {
              carBookedToDate: { gte: fromDate },
            },
          ],
        },
      },
    });
  }

  const where: Prisma.CarWhereInput = { AND: filters };

  const result = await prisma.car.findMany({
    where,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : {
            carRating: "desc",
          },
    include: {
      car_Rental: {
        select: {
          id: true,
          carName: true,
          carBookingCondition: true,
          carCancelationPolicy: true,
        },
      },
      review: true,
    },
  });

  const total = await prisma.car.count({ where });

  // currency conversion
  const rates = await CurrencyHelpers.getExchangeRates();
  const displayCurrency = userCurrency.toUpperCase();
  const currencySymbol = CurrencyHelpers.getCurrencySymbol(displayCurrency);

  const convertedCars = result.map((car) => {
    const baseCurrency = car.currency || "USD";
    const originalPrice = car.carPriceDay || 0;

    const exchangeRate =
      rates[displayCurrency] && rates[baseCurrency]
        ? rates[displayCurrency] / rates[baseCurrency]
        : 1;

    const convertedPrice = CurrencyHelpers.convertPrice(
      originalPrice,
      baseCurrency,
      displayCurrency,
      rates
    );

    const discountedPrice = CurrencyHelpers.convertPrice(
      car.discount || 0,
      baseCurrency,
      displayCurrency,
      rates
    );

    return {
      ...car,
      originalPrice,
      originalCurrency: baseCurrency,
      convertedPrice: Number(convertedPrice.toFixed(2)),
      discountedPrice: Number(discountedPrice.toFixed(2)),
      displayCurrency,
      exchangeRate: Number(exchangeRate.toFixed(2)),
      currencySymbol,
    };
  });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: convertedCars,
  };
};

// get all car rentals cars by carRental id
const getAllCarRentalsCarsByCarRentalId = async (
  params: ICarRentalFilter,
  options: IPaginationOptions,
  carRentalId: string
) => {
  const { limit, page, skip } = paginationHelpers.calculatedPagination(options);

  const { searchTerm, fromDate, toDate, ...filterData } = params;

  const filters: Prisma.CarWhereInput[] = [];

  filters.push({
    car_RentalId: carRentalId,
  });

  // text search
  if (searchTerm) {
    filters.push({
      OR: searchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  // Exact search filter
  if (Object.keys(filterData).length > 0) {
    filters.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as any)[key],
        },
      })),
    });
  }

  // Availability filter
  if (fromDate && toDate) {
    filters.push({
      car_Booking: {
        none: {
          bookingStatus: BookingStatus.CONFIRMED,
          AND: [
            {
              carBookedFromDate: { lte: toDate },
            },
            {
              carBookedToDate: { gte: fromDate },
            },
          ],
        },
      },
    });
  }

  const where: Prisma.CarWhereInput = { AND: filters };

  const result = await prisma.car.findMany({
    where,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : {
            carRating: "desc",
          },
    include: {
      car_Rental: true,
    },
  });

  const total = await prisma.car.count({ where });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: result,
  };
};

// get all car rentals for partner
const getAllCarRentalsForPartner = async (
  partnerId: string,
  params: ICarRentalFilter,
  options: IPaginationOptions
) => {
  const { limit, page, skip } = paginationHelpers.calculatedPagination(options);

  const { searchTerm, ...filterData } = params;

  const filters: Prisma.Car_RentalWhereInput[] = [];

  filters.push({
    partnerId,
  });

  // text search
  if (params?.searchTerm) {
    filters.push({
      OR: searchableFields.map((field) => ({
        [field]: {
          contains: params.searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  // Exact search filter
  if (Object.keys(filterData).length > 0) {
    filters.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as any)[key],
        },
      })),
    });
  }

  const where: Prisma.Car_RentalWhereInput = { AND: filters };

  const result = await prisma.car_Rental.findMany({
    where,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : {
            createdAt: "desc",
          },
    include: {
      user: true,
    },
  });

  const total = await prisma.car_Rental.count({ where });

  // total car into each carRental
  const totalCarRentals = await prisma.car.groupBy({
    by: ["car_RentalId"],
    _count: {
      car_RentalId: true,
    },
    where: {
      car_RentalId: {
        in: result.map((car) => car.id),
      },
    },
  });

  // merge carRental with total car
  const CarRentalWithCarCount = result.map((carRental) => {
    const countObj = totalCarRentals.find(
      (r) => r.car_RentalId === carRental.id
    );
    return {
      ...carRental,
      totalCar: countObj?._count.car_RentalId || 0,
    };
  });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: CarRentalWithCarCount,
  };
};

// get all car rentals cars for partner
const getAllCarRentalsCarsForPartner = async (
  car_RentalId: string,
  params: ICarRentalFilter,
  options: IPaginationOptions
) => {
  const { limit, page, skip } = paginationHelpers.calculatedPagination(options);

  const { searchTerm, ...filterData } = params;

  const filters: Prisma.CarWhereInput[] = [];

  filters.push({
    car_RentalId,
  });

  // text search
  if (params?.searchTerm) {
    filters.push({
      OR: searchableFields.map((field) => ({
        [field]: {
          contains: params.searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  // Exact search filter
  if (Object.keys(filterData).length > 0) {
    filters.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as any)[key],
        },
      })),
    });
  }

  const where: Prisma.CarWhereInput = { AND: filters };

  const result = await prisma.car.findMany({
    where,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : {
            createdAt: "desc",
          },
    include: {
      user: true,
    },
  });

  const total = await prisma.car.count({ where });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: result,
  };
};

// get single car rental
const getSingleCarRental = async (carRentalId: string) => {
  const result = await prisma.car_Rental.findUnique({
    where: { id: carRentalId },
  });
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Car Rental not found");
  }
  return result;
};

// get single cars
const getSingleCar = async (carId: string) => {
  const result = await prisma.car.findUnique({
    where: { id: carId },
  });
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Car not found");
  }
  return result;
};

// update Car Rental
const updateCarRental = async (req: Request) => {
  const partnerId = req.user?.id;
  const car_RentalId = req.params.car_RentalId;

  // check partner exists
  const partnerExists = await prisma.user.findUnique({
    where: { id: partnerId },
  });
  if (!partnerExists) {
    throw new ApiError(httpStatus.NOT_FOUND, "Partner not found");
  }

  // check if rental exists and belongs to partner
  const carRentalExists = await prisma.car_Rental.findUnique({
    where: { id: car_RentalId },
  });
  console.log(carRentalExists, "carRentalExists");
  if (!carRentalExists) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Car Rental not found or unauthorized"
    );
  }

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const carLogoFile = files?.businessLogo?.[0];
  const carDocsFiles = files?.carDocs || [];

  const {
    carBusinessName,
    carName,
    carBusinessType,
    carRegNum,
    carRegDate,
    carPhone,
    carEmail,
    carTagline,
    carRentalDescription,
    carBookingCondition,
    carCancelationPolicy,
    businessLogo: logoUrlFromMainBody,
    carDocs: docsUrlFromMainBody,
  } = req.body;

  // upload logo if provided
  let businessLogo = carRentalExists.businessLogo;
  if (carLogoFile) {
    const logoResult = await uploadFile.uploadToCloudinary(carLogoFile);
    businessLogo = logoResult?.secure_url || businessLogo;
  } else if (logoUrlFromMainBody) {
    businessLogo = logoUrlFromMainBody;
  }

  // upload docs if provided
  let carDocUrls = carRentalExists.carDocs || [];
  if (docsUrlFromMainBody !== undefined) {
    carDocUrls = Array.isArray(docsUrlFromMainBody)
      ? docsUrlFromMainBody
      : [docsUrlFromMainBody];
  }

  if (carDocsFiles.length > 0) {
    const uploads = await Promise.all(
      carDocsFiles.map((file) => uploadFile.uploadToCloudinary(file))
    );
    const newDocUrls = uploads.map((img) => img?.secure_url || "");
    carDocUrls = [...carDocUrls, ...newDocUrls];
  }

  return await prisma.car_Rental.update({
    where: { id: car_RentalId },
    data: {
      carBusinessName,
      carName,
      carBusinessType,
      carRegNum,
      carRegDate,
      carPhone,
      carEmail,
      carTagline,
      carRentalDescription,
      carBookingCondition,
      carCancelationPolicy,
      businessLogo,
      carDocs: carDocUrls,
    },
  });
};

// update Car
const updateCar = async (req: Request) => {
  const partnerId = req.user?.id;
  const carId = req.params.carId;

  // check partner exists
  const partnerExists = await prisma.user.findUnique({
    where: { id: partnerId },
  });
  if (!partnerExists) {
    throw new ApiError(httpStatus.NOT_FOUND, "Partner not found");
  }

  const carExists = await prisma.car.findFirst({
    where: { id: carId, partnerId },
  });
  if (!carExists) {
    throw new ApiError(httpStatus.NOT_FOUND, "Car not found or unauthorized");
  }

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const carImageFiles = files?.carImages || [];

  const {
    carAddress,
    carPostalCode,
    carDistrict,
    carCity,
    carCountry,
    carDescription,
    carServicesOffered,
    carType,
    carSeats,
    carOilType,
    carEngineType,
    carTransmission,
    carPower,
    carDrivetrain,
    carMileage,
    carModel,
    carCapacity,
    carColor,
    fuelType,
    gearType,
    carRating,
    carPriceDay,
    category,
    discount,
    carReviewCount,
    carBookingAbleDays,
    currency,
    carImages: imagesUrlFromMainBody,
  } = req.body;

  // Upload new images if provided
  let carImageUrls = carExists.carImages || [];
  if (imagesUrlFromMainBody !== undefined) {
    carImageUrls = Array.isArray(imagesUrlFromMainBody)
      ? imagesUrlFromMainBody
      : [imagesUrlFromMainBody];
  }

  if (carImageFiles.length > 0) {
    const uploads = await Promise.all(
      carImageFiles.map((file) => uploadFile.uploadToCloudinary(file))
    );
    const newCarUrls = uploads.map((img) => img?.secure_url || "");
    carImageUrls = [...carImageUrls, ...newCarUrls];
  }

  return await prisma.car.update({
    where: { id: carId },
    data: {
      carAddress: carAddress || carExists.carAddress,
      carPostalCode: carPostalCode || carExists.carPostalCode,
      carDistrict: carDistrict || carExists.carDistrict,
      carCity: carCity || carExists.carCity,
      carCountry: carCountry || carExists.carCountry,
      carDescription: carDescription || carExists.carDescription,
      carImages: carImageUrls,
      carServicesOffered: carServicesOffered
        ? (Array.isArray(carServicesOffered)
          ? carServicesOffered
          : carServicesOffered.split(",").map((s: string) => s.trim()))
        : carExists.carServicesOffered,
      carType: carType || carExists.carType,
      carSeats: carSeats || carExists.carSeats,
      carOilType: carOilType || carExists.carOilType,
      carEngineType: carEngineType || carExists.carEngineType,
      carTransmission: carTransmission || carExists.carTransmission,
      carPower: carPower || carExists.carPower,
      carDrivetrain: carDrivetrain || carExists.carDrivetrain,
      carMileage: carMileage || carExists.carMileage,
      carModel: carModel || carExists.carModel,
      carCapacity: carCapacity || carExists.carCapacity,
      carColor: carColor || carExists.carColor,
      fuelType: fuelType || carExists.fuelType,
      gearType: gearType || carExists.gearType,
      carRating: carRating || carExists.carRating,
      carPriceDay: carPriceDay ? parseFloat(carPriceDay) : carExists.carPriceDay,
      carBookingAbleDays: carBookingAbleDays
        ? (Array.isArray(carBookingAbleDays)
          ? carBookingAbleDays
          : carBookingAbleDays.split(",").map((s: string) => s.trim()))
        : carExists.carBookingAbleDays,
      category: category || carExists.category,
      discount: discount ? parseFloat(discount) : carExists.discount,
      carReviewCount: carReviewCount ? parseInt(carReviewCount) : carExists.carReviewCount,
      currency: currency ? currency.toUpperCase() : carExists.currency,
    },
  });
};

// delete Car Rental
const deleteCarRental = async (carRentalId: string, partnerId: string) => {
  // check if car rental exists
  const carRentalExists = await prisma.car_Rental.findUnique({
    where: { id: carRentalId },
  });
  if (!carRentalExists) {
    throw new ApiError(httpStatus.NOT_FOUND, "Car rental not found");
  }

  // check partner exists
  const partnerExists = await prisma.user.findUnique({
    where: { id: partnerId },
  });
  if (!partnerExists) {
    throw new ApiError(httpStatus.NOT_FOUND, "Partner not found");
  }

  // delete car rental
  return await prisma.car_Rental.delete({
    where: { id: carRentalId },
  });
};

// delete Car
const deleteCar = async (carId: string, partnerId: string) => {
  // check if car exists
  const carExists = await prisma.car.findUnique({
    where: { id: carId },
  });
  if (!carExists) {
    throw new ApiError(httpStatus.NOT_FOUND, "Car not found");
  }

  // check partner exists
  const partnerExists = await prisma.user.findUnique({
    where: { id: partnerId },
  });
  if (!partnerExists) {
    throw new ApiError(httpStatus.NOT_FOUND, "Partner not found");
  }

  // delete car
  return await prisma.car.delete({
    where: { id: carId },
  });
};

export const CarRentalService = {
  createCarRental,
  createCar,
  getAllCarActiveListingByPartnerId,
  getAllAvailableListingCarByPartnerId,
  getAllCarRentals,
  getAllCarRentalsCars,
  getAllCarRentalsCarsByCarRentalId,
  getAllCarRentalsForPartner,
  getAllCarRentalsCarsForPartner,
  getSingleCarRental,
  getSingleCar,
  updateCarRental,
  updateCar,
  deleteCarRental,
  deleteCar,
};

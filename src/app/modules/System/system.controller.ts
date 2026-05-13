import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import os from "os";

const getSystemStats = catchAsync(async (req: Request, res: Response) => {
  const memoryUsage = process.memoryUsage();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  
  const cpuUsage = os.loadavg(); // Returns an array containing the 1, 5, and 15 minute load averages.
  const uptime = os.uptime();
  const platform = os.platform();
  const architecture = os.arch();
  const cpus = os.cpus();

  const stats = {
    memory: {
      total: (totalMemory / 1024 / 1024 / 1024).toFixed(2) + " GB",
      free: (freeMemory / 1024 / 1024 / 1024).toFixed(2) + " GB",
      used: (usedMemory / 1024 / 1024 / 1024).toFixed(2) + " GB",
      usagePercentage: ((usedMemory / totalMemory) * 100).toFixed(2) + "%",
    },
    heap: {
      rss: (memoryUsage.rss / 1024 / 1024).toFixed(2) + " MB",
      heapTotal: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2) + " MB",
      heapUsed: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2) + " MB",
      external: (memoryUsage.external / 1024 / 1024).toFixed(2) + " MB",
    },
    cpu: {
      model: cpus[0].model,
      cores: cpus.length,
      loadAverage: cpuUsage,
    },
    system: {
      uptime: (uptime / 3600).toFixed(2) + " hours",
      platform,
      architecture,
    },
    timestamp: new Date().toISOString(),
  };

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "System statistics fetched successfully",
    data: stats,
  });
});

export const SystemController = {
  getSystemStats,
};

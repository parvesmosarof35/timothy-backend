import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import os from "os";
import fs from "fs/promises";
import prisma from "../../../shared/prisma";
import { UserStatus } from "@prisma/client";
import { requestTracker } from "../../utils/requestTracker";
import { cacheManager } from "../../utils/cache";
import { activityLogger } from "../../utils/activityLogger";

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

  // Disk usage
  const diskStats = await fs.statfs(process.cwd());
  const totalDisk = diskStats.bsize * diskStats.blocks;
  const freeDisk = diskStats.bsize * diskStats.bfree;
  const usedDisk = totalDisk - freeDisk;

  // Active users
  const totalUsers = await prisma.user.count();
  const activeUsers = await prisma.user.count({
    where: { status: UserStatus.ACTIVE },
  });

  const stats = {
    memory: {
      total: (totalMemory / 1024 / 1024 / 1024).toFixed(2) + " GB",
      free: (freeMemory / 1024 / 1024 / 1024).toFixed(2) + " GB",
      used: (usedMemory / 1024 / 1024 / 1024).toFixed(2) + " GB",
      usagePercentage: ((usedMemory / totalMemory) * 100).toFixed(2) + "%",
    },
    storage: {
      total: (totalDisk / 1024 / 1024 / 1024).toFixed(2) + " GB",
      free: (freeDisk / 1024 / 1024 / 1024).toFixed(2) + " GB",
      used: (usedDisk / 1024 / 1024 / 1024).toFixed(2) + " GB",
      usagePercentage: ((usedDisk / totalDisk) * 100).toFixed(2) + "%",
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
    traffic: {
      hitsPerMinute: requestTracker.getHitsPerMinute(),
      hitsPerHour: requestTracker.getHitsPerHour(),
      avgLatency: requestTracker.getAverageLatency() + " ms",
      health: requestTracker.getHealthStats(),
    },
    users: {
      total: totalUsers,
      active: activeUsers,
    },
    cache: cacheManager.getStats(),
    logs: activityLogger.getLogs(),
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

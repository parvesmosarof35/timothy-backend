import { Response } from "express"

const sendResponse = <T>(res: Response, jsonData: {
    statusCode: number,
    success: boolean,
    message: string,
    meta?: {
        page: number,
        limit: number,
        total: number,
        totalPages?: number,
        hasPreviousPage?: boolean,
        hasPriviousPage?: boolean,
        hasNextPage?: boolean,
    },
    data: T | null | undefined
}) => {
    let meta = jsonData.meta;
    let data = jsonData.data;

    // If data itself is an object returned from services containing meta and data
    if (data && typeof data === 'object' && 'meta' in (data as any) && 'data' in (data as any)) {
        const dataObj = data as any;
        const innerMeta = dataObj.meta;
        if (innerMeta && typeof innerMeta === 'object' && typeof innerMeta.page === 'number' && typeof innerMeta.limit === 'number') {
            const totalVal = typeof innerMeta.total === 'number' ? innerMeta.total : 0;
            const totalPages = Math.ceil(totalVal / innerMeta.limit) || 1;
            dataObj.meta = {
                ...innerMeta,
                total: totalVal,
                totalPages,
                hasPreviousPage: innerMeta.page > 1,
                hasPriviousPage: innerMeta.page > 1,
                hasNextPage: innerMeta.page < totalPages,
            };
        }
    }

    if (meta && typeof meta.page === 'number' && typeof meta.limit === 'number') {
        const totalVal = typeof meta.total === 'number' ? meta.total : 0;
        const totalPages = Math.ceil(totalVal / meta.limit) || 1;
        meta = {
            ...meta,
            total: totalVal,
            totalPages,
            hasPreviousPage: meta.page > 1,
            hasPriviousPage: meta.page > 1,
            hasNextPage: meta.page < totalPages,
        };
    }

    res.status(jsonData.statusCode).json({
        success: jsonData.success,
        message: jsonData.message,
        meta: meta || null || undefined,
        data: data || null || undefined
    })
}

export default sendResponse;
import { ActivityLog } from '../models/index';


export default class ActivityLogService {
    static async getAllLogs(search?: string) {
        // Build search condition
        let match: any = {};
        if (search) {
            match = {
                $or: [
                    { "actor.firstName": { $regex: search, $options: "i" } },
                    { "actor.lastName": { $regex: search, $options: "i" } },
                    { "actor.matricNo": { $regex: search, $options: "i" } }
                ]
            };
        }

        const logs = await ActivityLog.find()
            .populate({
                path: "actor",
                select: "firstName lastName email matricNo",
                match
            })
            .sort({ timestamp: -1 });

        // Filter out logs with no matched actor after population
        const filteredLogs = logs.filter(log => log.actor);

        return filteredLogs.map(log => {
            const actor = log.actor as any;
            const name = `${actor?.firstName || ''} ${actor?.lastName || ''}`.trim();
            const time = log.timestamp;

            return {
                message: `${name} ${log.action} ${log.entity} on ${time}`,
                actor: {
                    name,
                    email: actor?.email,
                    matricNo: actor?.matricNo,
                },
                time
            };
        });
    }


    static async getLogsForHOD(department: string, search?: string) {
        let match: any = {};
        if (search) {
            match = {
                $or: [
                    { "actor.firstName": { $regex: search, $options: "i" } },
                    { "actor.lastName": { $regex: search, $options: "i" } },
                    { "actor.matricNo": { $regex: search, $options: "i" } }
                ]
            };
        }

        const logs = await ActivityLog.find({ department })
            .populate({
                path: "actor",
                select: "firstName lastName email matricNo",
                match
            })
            .sort({ timestamp: -1 });

        const filteredLogs = logs.filter(log => log.actor);

        return filteredLogs.map(log => {
            const actor = log.actor as any;
            const name = `${actor?.firstName || ''} ${actor?.lastName || ''}`.trim();
            const time = log.timestamp;

            return {
                message: `${name} ${log.action} ${log.entity} on ${time}`,
                actor: {
                    name,
                    email: actor?.email,
                    matricNo: actor?.matricNo,
                },
                time
            };
        });
    }


    static async getLogsForSchool(school: string, search?: string) {
        let match: any = {};
        if (search) {
            match = {
                $or: [
                    { "actor.firstName": { $regex: search, $options: "i" } },
                    { "actor.lastName": { $regex: search, $options: "i" } },
                    { "actor.matricNo": { $regex: search, $options: "i" } }
                ]
            };
        }

        const logs = await ActivityLog.find({ school })
            .populate({
                path: "actor",
                select: "firstName lastName email matricNo",
                match
            })
            .sort({ timestamp: -1 });

        const filteredLogs = logs.filter(log => log.actor);

        return filteredLogs.map(log => {
            const actor = log.actor as any;
            const name = `${actor?.firstName || ''} ${actor?.lastName || ''}`.trim();
            const time = log.timestamp;

            return {
                message: `${name} ${log.action} ${log.entity} on ${time}`,
                actor: {
                    name,
                    email: actor?.email,
                    matricNo: actor?.matricNo,
                },
                time
            };
        });
    }

    static async logActivity(userId: string, name: string, role: string, action: string, entity: string, department: string, school: string) {
        await ActivityLog.create({
            actor: userId,
            name,
            role,
            action,
            entity,
            department,
            school,
            timestamp: new Date(),
        });
    }

}

import { School, User } from '../models/index';
// Assuming a Payment model for Revenue. If not, you can track this via School subscriptions.
// import { Payment } from '../models/payment.model'; 

export default class AnalyticsService {
  static async getDashboardStats(year: number = new Date().getFullYear()) {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    // 1. Revenue Growth (Monthly)
    // const revenueGrowth = await Payment.aggregate([
    //   { $match: { createdAt: { $gte: startOfYear, $lte: endOfYear }, status: 'success' } },
    //   {
    //     $group: {
    //       _id: { $month: "$createdAt" },
    //       total: { $sum: "$amount" }
    //     }
    //   },
    //   { $sort: { "_id": 1 } }
    // ]);

    // 2. School Growth (Monthly)
    const schoolGrowth = await School.aggregate([
      { $match: { createdAt: { $gte: startOfYear, $lte: endOfYear } } },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // 3. Student Growth (Monthly)
    // Assuming students are Users with a specific role
    const studentGrowth = await User.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startOfYear, $lte: endOfYear },
          roles: { $in: ["student"] } 
        } 
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // 4. Active vs Inactive Users (Donut Chart)
    const userStatusStats = await User.aggregate([
      {
        $group: {
          _id: "$status", // 'Active' or 'Suspended'
          count: { $sum: 1 }
        }
      }
    ]);

    return {
    // revenue: this.formatMonthlyData(revenueGrowth),
      schools: this.formatMonthlyData(schoolGrowth),
      students: this.formatMonthlyData(studentGrowth),
      userStatus: userStatusStats
    };
  }

  /**
   * Helper to ensure all 12 months are present, even with 0 values
   */
  private static formatMonthlyData(data: any[]) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months.map((month, index) => {
      const monthData = data.find(d => d._id === index + 1);
      return {
        month,
        value: monthData ? (monthData.total || monthData.count) : 0
      };
    });
  }
}
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';
import morgan from 'morgan'




dotenv.config();

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import lecturerRoutes from './routes/lecturer.routes';
import notificationRoutes from './routes/notification.routes';
import sessionRoutes from './routes/session.routes';
import projectRoutes from './routes/project.routes';
import studentRoutes from './routes/student.routes';
import departmentRoutes from './routes/department.routes';
import facultyRoutes from './routes/faculty.routes';
import defenceRoutes from './routes/defence.routes';
import scoreSheetRoute from './routes/scoresheet.routes';
import dashboardRoutes from './routes/dashboard.routes';
import institutionRoutes from './routes/institutions.routes';
import schoolRoutes from './routes/school.routes';
import analyticsRoutes from './routes/analytics.routes';
import pgadminRoutes from './routes/pg_admin.routes';
import checklistRoutes from './routes/checklist.routes';
import readinessFormRoutes from './routes/readinessForm.routes';


import ProjectService from './services/project';

const app = express();

//Security Middlewares
app.use(helmet()); // sets secure HTTP headers
app.use(morgan('dev'))

// app.use(cors({
//   origin: process.env.FRONTEND_URL, // restrict to frontend domain in prod
//   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
//   credentials: true,
// }));
const allowedOrigins = [
  'http://localhost:8080',
  'https://fulafia-electronic-tracking-and-8x35.onrender.com',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
}));


// Only parse JSON for POST, PUT, PATCH
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    express.json({ limit: '10kb' })(req, res, next);
  } else {
    next();
  }
});


//Rate limiting (apply only to auth routes, you can add per route if needed)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP
  message: 'Too many requests from this IP, please try again later',
});
app.use('/api/auth', limiter);

// Static files - FIXED PATH
const getProjectRoot = () => {
  if (process.env.NODE_ENV === 'production') {
    // Match your multer config - go up 4 levels from dist/src
    return path.join(__dirname, '..', '..', '..');2
  }
  return process.cwd();
};

const projectRoot = getProjectRoot();
const uploadsPath = path.join(projectRoot, 'uploads');

console.log('=== EXPRESS STATIC CONFIG ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('__dirname:', __dirname);
console.log('Project root:', projectRoot);
console.log('Uploads path:', uploadsPath);
console.log('=============================');

app.use('/uploads', express.static(uploadsPath));

//Routes
app.use('/api/auth', authRoutes);
app.use('/api/lecturer', lecturerRoutes);
app.use('/api/user', userRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/project', projectRoutes);
app.use('/api/student', studentRoutes);
app.use("/api/department", departmentRoutes);
app.use("/api/faculty", facultyRoutes);
app.use('/api/defence', defenceRoutes);
app.use('/api/defence', scoreSheetRoute);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/institution', institutionRoutes)
app.use('/api/school', schoolRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/pg_admin', pgadminRoutes)
app.use('/api/checklist', checklistRoutes)
app.use('/api/readiness', readinessFormRoutes)

//Global error handler (avoid exposing stack traces in prod)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    error: 'Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
  });
});





// Run once immediately
(async () => {
  try {
    console.log("Initial stale project check...");
    await ProjectService.checkStaleProjects();
  } catch (err) {
    console.error("Error during initial stale project check:", err);
  }
})();

// Run daily at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    console.log("🕒 Running daily stale project check...");
    await ProjectService.checkStaleProjects();
  } catch (err) {
    console.error("❌ Error during daily stale project check:", err);
  }
});



export default app;

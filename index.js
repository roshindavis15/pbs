    import express from 'express';
    import dotenv from 'dotenv';
    import { initializeDatabase } from './models/index.js'
    import adminRouter from './routes/adminRoutes.js';
    import cors from 'cors'

    dotenv.config();
    const app = express();
    const port = process.env.PORT || 3000;

    app.use(cors({
        origin: "https://pbs-dashboard.vercel.app",
      }));
      
    app.use(express.json());
    app.use('/admin', adminRouter);

    const startServer = async () => {
        try {
            await initializeDatabase();
            app.listen(port, () => {
                console.log(`Server is running on http://localhost:${port}`);
            });
        } catch (error) {
            console.error('Failed to start server:', error);
        }
    };

    startServer();
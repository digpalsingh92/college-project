import app from './src/app.js';
import prisma from './src/lib/prisma.js';

const startServer = async () => {
    try {
        await prisma.$connect();
        console.log('Database connected successfully');
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }

    if (!process.env.JWT_SECRET?.trim()) {
        console.error(
            '[server] FATAL: JWT_SECRET is required for auth (register/login). Set it in server/.env, e.g. JWT_SECRET="your-long-random-string"'
        );
        process.exit(1);
    }

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });

    
};

void startServer();
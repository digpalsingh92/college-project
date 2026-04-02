import app from './src/app';

const startServer = () => {
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });

    
};

void startServer();
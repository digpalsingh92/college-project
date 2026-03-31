import dotenv from 'dotenv';
import app from './app';

dotenv.config();

const PORT = process.env.PORT || 4002;

app.listen(PORT, () => {
  console.log(`patient service running on port ${PORT}`);
});

import dotenv from 'dotenv';
import app from './app';

dotenv.config();

const PORT = process.env.PORT || 4001;

app.listen(PORT, () => {
  console.log(`admin service running on port ${PORT}`);
});

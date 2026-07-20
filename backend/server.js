import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { initializeRedis } from './config/redis.js';
import wholesaleSellerRouter from './routes/wholesale-sellerRouter.js';
import productRouter from './routes/productRouter.js';
import orderRouter from './routes/orderRouter.js';
import connectCloudinary from './config/cloudinary.js';

// App config
const app = express();
const port = process.env.PORT || 4000;
connectCloudinary();

// Initialize Redis on startup
await initializeRedis().catch((error) => {
  console.warn('Redis initialization failed, continuing without caching:', error.message);
});

// Middlewares
app.use(express.json());
app.use(cors());

// API Endpoints
app.use('/api/wholesale-seller', wholesaleSellerRouter);
app.use('/api/product', productRouter);
app.use('/api/order', orderRouter);

app.get('/', (req, res) => {
    res.send('API working');
});

app.listen(port, () => {
    console.log('✓ Server started on port: ' + port);
    console.log('✓ Prisma connected to PostgreSQL');
});

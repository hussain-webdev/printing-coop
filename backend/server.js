import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/mongodb.js';
import userRouter from './routes/userRouter.js';
import wholesaleSellerRouter from './routes/wholesale-sellerRouter.js';

// App config
const app = express();
const port = process.env.PORT || 4000;
connectDB();

// Middlewares
app.use(express.json());
app.use(cors());

//API Endpoints
app.use('/api/user', userRouter)
app.use('/api/wholesale-seller', wholesaleSellerRouter)

app.get('/', (req, res) => {
    res.send('API working');
});

app.listen(port, () => {
    console.log('server started on port:' + port)
});
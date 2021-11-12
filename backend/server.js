import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import colors from 'colors';
import morgan from 'morgan';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import connectDB from './config/db.js';

import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: 'rzp_test_LorPXrJRKdHWNF',
  key_secret: 'QStWmtCoKkQpruEbU0GZMM73',
});

dotenv.config();

connectDB();

const app = express();

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());

app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/api/config/paypal', (req, res) =>
  res.send(process.env.PAYPAL_CLIENT_ID)
);

const __dirname = path.resolve();
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '/frontend/build')));

  app.get('*', (req, res) =>
    res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html'))
  );
} else {
  app.get('/', (req, res) => {
    res.send('API is running....');
  });
}

app.get('/razorpay', (req, res) => {
  res.send('working...');
});

// app.post('/verification', (req, res) => {
//   // do a validation
//   const secret = '12345678';

//   console.log(req.body);

//   const crypto = require('crypto');

//   const shasum = crypto.createHmac('sha256', secret);
//   shasum.update(JSON.stringify(req.body));
//   const digest = shasum.digest('hex');

//   console.log(digest, req.headers['x-razorpay-signature']);

//   if (digest === req.headers['x-razorpay-signature']) {
//     console.log('request is legit');
//     // process it
//     require('fs').writeFileSync(
//       'payment1.json',
//       JSON.stringify(req.body, null, 4)
//     );
//   } else {
//     // pass it
//   }
//   res.json({ status: 'ok' });
// });

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  )
);

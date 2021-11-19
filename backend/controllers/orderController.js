import asyncHandler from 'express-async-handler';
import Order from '../models/orderModel.js';
import { v4 as uuidv4 } from 'uuid';
// @desc    Create new order
// @route   POST /api/orders
// @access  Private
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: 'rzp_test_LorPXrJRKdHWNF',
  key_secret: 'QStWmtCoKkQpruEbU0GZMM73',
});

const addOrderItems = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  if (orderItems && orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
    return;
  } else {
    const order = new Order({
      orderItems,
      user: req.user._id,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    });

    const createdOrder = await order.save();

    res.status(201).json(createdOrder);
  }
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    'user',
    'name email'
  );

  if (order) {
    res.json(order);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Update order to paid
// @route   GET /api/orders/:id/payment
// @access  Private
const updateOrderToPaidRp = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      payment_Id: req.body.razorpay_payment_id,
      order_Id: req.body.razorpay_order_id,
      razorpay_signature: req.body.razorpay_signature
    };

    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

const updateOrderToPaidCOD = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    order.isPaid = true;
    order.paidAt = Date.now();
    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Update order to delivered
// @route   GET /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    order.isDelivered = true;
    order.deliveredAt = Date.now();

    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id });
  res.json(orders);
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({}).populate('user', 'id name');
  res.json(orders);
});

const payment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    const payment_capture = 1;
    const amount = order.totalPrice;
    const currency = 'INR';
    let options = {
      amount: amount * 100,
      currency,
      receipt: uuidv4(),
      payment_capture
    }
    try {
      const response = await razorpay.orders.create(options)
      console.log("response = " , response)
      res.json({
        id: response.id,
        currency: response.currency,
        amount: response.amount
      })
    } catch (error) {
      console.log(error)
    }
    // razorpay.orders.create(options, function (err, order) {
    //   console.log(order);
    //   res.json(order);
    // });
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// const checkPayment = asyncHandler(async (req, res) => {
//   // razorpay.payments.fetch(req.body.razorpay_payment_id).then((paymentDocument) => {
//   //   // console.log(paymentDocument)
//   //   if(paymentDocument.status === "captured") {
//   //     res.send("payment successful")
//   //   }else {
//   //     res.send("payment unsuccessful")
//   //   }
//   // })
// }) ;

export {
  addOrderItems,
  getOrderById,
  updateOrderToPaidRp,
  updateOrderToPaidCOD,
  updateOrderToDelivered,
  getMyOrders,
  getOrders,
  payment,
  // checkPayments
};

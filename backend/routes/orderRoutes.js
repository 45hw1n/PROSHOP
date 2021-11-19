import express from 'express'
const router = express.Router()
import {
  addOrderItems,
  getOrderById,
  updateOrderToPaidRp,
  updateOrderToPaidCOD,
  updateOrderToDelivered,
  getMyOrders,
  getOrders,
  payment,
  // checkPayment
} from '../controllers/orderController.js'
import { protect, admin } from '../middleware/authMiddleware.js'

router.route('/').post(protect, addOrderItems).get(protect, admin, getOrders)
router.route('/myorders').get(protect, getMyOrders)
router.route('/:id').get(protect, getOrderById)
router.route('/:id/payment').post(payment)
router.route('/:id/payment').put(updateOrderToPaidRp)
router.route('/:id/payment').put(protect, updateOrderToPaidCOD)
router.route('/:id/deliver').put(protect, admin, updateOrderToDelivered)

export default router

import express from 'express'
const router = express.Router()
import {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  updateOrderToPaidCOD,
  updateOrderToDelivered,
  getMyOrders,
  getOrders,
  payment
} from '../controllers/orderController.js'
import { protect, admin } from '../middleware/authMiddleware.js'

router.route('/').post(protect, addOrderItems).get(protect, admin, getOrders)
router.route('/myorders').get(protect, getMyOrders)
router.route('/:id').get(protect, getOrderById)
router.route('/:id/payment').post(payment)
router.route('/:id/payment-success').put(updateOrderToPaid)
router.route('/:id/cod').put(protect, updateOrderToPaidCOD)
router.route('/:id/deliver').put(protect, admin, updateOrderToDelivered)

export default router

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PayPalButton } from 'react-paypal-button-v2';
import { Link } from 'react-router-dom';
import { Row, Col, ListGroup, Image, Card, Button } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import Message from '../components/Message';
import Loader from '../components/Loader';
import {
  getOrderDetails,
  payOrder,
  payOrderCod,
  deliverOrder,
} from '../actions/orderActions';
import {
  ORDER_PAY_RESET,
  ORDER_DELIVER_RESET,
  ORDER_PAY_COD_RESET,
} from '../constants/orderConstants';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function loadScript(src) {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

const __DEV__ = document.domain === 'localhost';

const OrderScreen = ({ match, history }) => {
  const orderId = match.params.id;

  const [sdkReady, setSdkReady] = useState(false);

  const dispatch = useDispatch();

  const orderDetails = useSelector((state) => state.orderDetails);
  const { order, loading, error } = orderDetails;

  const orderPay = useSelector((state) => state.orderPay);
  const { loading: loadingPay, success: successPay } = orderPay;

  const orderPayCod = useSelector((state) => state.orderPayCod);
  const { loading: loadingPayCod, success: successPayCod } = orderPayCod;

  const orderDeliver = useSelector((state) => state.orderDeliver);
  const { loading: loadingDeliver, success: successDeliver } = orderDeliver;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  if (!loading) {
    //   Calculate prices
    const addDecimals = (num) => {
      return (Math.round(num * 100) / 100).toFixed(2);
    };

    order.itemsPrice = addDecimals(
      order.orderItems.reduce((acc, item) => acc + item.price * item.qty, 0)
    );
  }

  useEffect(() => {
    if (!userInfo) {
      history.push('/login');
    }

    if (
      !order ||
      successPay ||
      successPayCod ||
      successDeliver ||
      order._id !== orderId
    ) {
      dispatch({ type: ORDER_PAY_RESET });
      dispatch({ type: ORDER_PAY_COD_RESET });
      dispatch({ type: ORDER_DELIVER_RESET });
      dispatch(getOrderDetails(orderId));
    }
    // else if (!order.isPaid) {
    //   if (!window.paypal) {
    //     addPayPalScript();
    //   } else {
    //     setSdkReady(true);
    //   }
    // }
  }, [dispatch, orderId, successPay, successPayCod, successDeliver, order]);

  const [cod, setCod] = useState(false);

  const [successRazor, setSuccessRazor] = useState(false);

  const codHandler = () => {
    dispatch(payOrderCod(order));
    toast.success('Order Placed successfully!');
    setCod(true);
  };

  const deliverHandler = () => {
    dispatch(deliverOrder(order));
  };

  async function razorpayHandler() {

    const res = await loadScript(
      'https://checkout.razorpay.com/v1/checkout.js'
    );

    if (!res) {
      alert('Razorpay SDK failed to load. Are you online?');
      return;
    }

    // const info = axios.post(`/api/orders/${order._id}/payment`)

    axios.post(`/api/orders/${order._id}/payment`).then((info) => {
      console.log("info = ",info);
      const options = {
        key: __DEV__ ? 'rzp_test_LorPXrJRKdHWNF' : 'PRODUCTION_KEY',
        // currency: order.currency,
        // amount: order.totalPrice.toString(),
        order_id: info.data.id,
        name: 'PROSHOP',
        callback_url: '/verify-order',
        // prefill: {
        //   name: 'Gaurav Kumar',
        //   email: 'gaurav.kumar@example.com',
        //   contact: '9999999999',
        // },

        handler: function (paymentResult) {
          console.log("paymentResult = ",paymentResult);
          setSuccessRazor(true);
          toast.success('Order Placed successfully!');
          dispatch(payOrder(orderId, paymentResult));
        },
      };
      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    });
  }

  return loading ? (
    <Loader />
  ) : error ? (
    <Message variant='danger'>{error}</Message>
  ) : (
    <>
      <h1></h1>
      <Row>
        <Col md={8}>
          <ListGroup variant='flush'>
            <ListGroup.Item>
              <h2>Shipping</h2>
              <h5 className='mb-3'>ID:{order._id}</h5>
              <p>
                <strong>Name: </strong> {order.user.name}
              </p>
              <p>
                <strong>Email: </strong>{' '}
                <a href={`mailto:${order.user.email}`}>{order.user.email}</a>
              </p>
              <p>
                <strong>Address:</strong>
                {order.shippingAddress.address}, {order.shippingAddress.city}{' '}
                {order.shippingAddress.postalCode},{' '}
                {order.shippingAddress.country}
              </p>
              {order.isDelivered ? (
                <Message variant='success'>
                  Delivered on {order.deliveredAt}
                </Message>
              ) : (
                <Message variant='danger'>Not Delivered</Message>
              )}
            </ListGroup.Item>

            <ListGroup.Item>
              <h2>Payment Method</h2>
              <p>
                <strong>Method: </strong>
                {order.paymentMethod}
              </p>
              {order.paymentMethod === 'Cash On Delivery' ? (
                <Message variant='warning'>
                  This order is cash on delivery
                </Message>
              ) : (
                <>
                  {order.isPaid ? (
                    <Message variant='success'>Paid on {order.paidAt}</Message>
                  ) : (
                    <Message variant='danger'>Not Paid</Message>
                  )}
                </>
              )}
            </ListGroup.Item>

            <ListGroup.Item>
              <h2>Order Items</h2>
              {order.orderItems.length === 0 ? (
                <Message>Order is empty</Message>
              ) : (
                <ListGroup variant='flush'>
                  {order.orderItems.map((item, index) => (
                    <ListGroup.Item key={index}>
                      <Row className='align-items-center'>
                        <Col md={3}>
                          <Image
                            src={item.image}
                            alt={item.name}
                            fluid
                            rounded
                          />
                        </Col>
                        <Col>
                          <Link to={`/product/${item.product}`}>
                            {item.name}
                          </Link>
                        </Col>
                        <Col md={4}>
                          {item.qty} x Rs.{item.price} = Rs.
                          {item.qty * item.price}
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </ListGroup.Item>
          </ListGroup>
        </Col>
        <Col md={4}>
          <Card>
            <ListGroup variant='flush'>
              <ListGroup.Item>
                <h2>Order Summary</h2>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Items</Col>
                  <Col>Rs.{order.itemsPrice}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Shipping</Col>
                  <Col>Rs.{order.shippingPrice}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Tax</Col>
                  <Col>Rs.{order.taxPrice}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Total</Col>
                  <Col>Rs.{order.totalPrice}</Col>
                </Row>
              </ListGroup.Item>
              {!order.isPaid && order.paymentMethod === 'Cash On Delivery' && (
                <>
                  {' '}
                  {cod === false && !order.isPaid ? (
                    <>
                      {loadingPayCod && <Loader />}
                      <Button
                        type='button'
                        className='btn btn-block'
                        onClick={codHandler}
                      >
                        Confirm Order (POD)
                      </Button>
                    </>
                  ) : (
                    <ToastContainer
                      position='top-right'
                      autoClose={5000}
                      hideProgressBar={false}
                      newestOnTop={false}
                      closeOnClick
                      rtl={false}
                      pauseOnFocusLoss
                      draggable
                      pauseOnHover
                    />
                  )}
                </>
              )}

              {
              !order.isPaid &&
              order.paymentMethod === 'PayPal' &&
              !successRazor ? (
                <>
                  <Button
                    type='button'
                    className='btn btn-block'
                    onClick={razorpayHandler}
                  >
                    RAZORPAY
                  </Button>
                </>
              ) : (
                <>
                  <ToastContainer
                    position='top-right'
                    autoClose={5000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                  />
                </>
              )}

              <>
                {' '}
                {userInfo &&
                userInfo.isAdmin &&
                order.isPaid &&
                !order.isDelivered ? (
                  <ListGroup.Item>
                    <Button
                      type='button'
                      className='btn btn-block'
                      onClick={deliverHandler}
                    >
                      Mark As Delivered
                    </Button>
                  </ListGroup.Item>
                ) : null}
              </>
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default OrderScreen;

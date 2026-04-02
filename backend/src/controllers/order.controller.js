const Booking = require("../models/Booking.model");
const Food = require("../models/Food.model");
const Coupon = require("../models/Coupon.model");
const Notification = require("../models/Notification.model");
const { ORDER_STATUS } = require("../utils/constants");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const { emitToUser, emitToAdmins } = require("../services/socket.service");

const VALID_TRANSITIONS = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PREPARING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PREPARING]: [ORDER_STATUS.PICKING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PICKING]: [ORDER_STATUS.DELIVERING],
  [ORDER_STATUS.DELIVERING]: [ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.DELIVERED]: [],
  [ORDER_STATUS.CANCELLED]: [],
};

const createOrder = asyncHandler(async (req, res) => {
  const {
    items,
    fulfillmentType,
    branch,
    shippingAddress,
    paymentMethod,
    couponCode,
    note,
    estimatedDelivery,
  } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: "Order must have at least one item" });
  }

  // Fetch foods and calculate subtotal
  const foodIds = items.map((item) => item.food);
  const foods = await Food.find({ _id: { $in: foodIds } });
  const foodMap = {};
  foods.forEach((f) => (foodMap[f._id.toString()] = f));

  let subtotal = 0;
  const orderItems = items.map((item) => {
    const food = foodMap[item.food];
    if (!food) throw new Error(`Food ${item.food} not found`);

    let itemPrice = food.price;
    if (item.variant) itemPrice += item.variant.price || 0;
    const toppingsPrice = (item.toppings || []).reduce((sum, t) => sum + (t.price || 0), 0);
    itemPrice += toppingsPrice;

    const totalPrice = itemPrice * item.quantity;
    subtotal += totalPrice;

    // Update sold count
    food.soldCount += item.quantity;
    food.save();

    return {
      food: food._id,
      name: food.name,
      image: food.images?.[0] || "",
      price: totalPrice / item.quantity,
      quantity: item.quantity,
      variant: item.variant,
      toppings: item.toppings || [],
      note: item.note,
    };
  });

  // Apply coupon
  let discountAmount = 0;
  let coupon = null;
  if (couponCode) {
    coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (coupon) {
      const now = new Date();
      if (coupon.startDate <= now && coupon.endDate >= now) {
        if (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) {
          if (subtotal >= coupon.minOrder) {
            if (coupon.type === "percent") {
              discountAmount = (subtotal * coupon.value) / 100;
              if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
            } else {
              discountAmount = coupon.value;
            }
            coupon.usedCount += 1;
            await coupon.save();
          }
        }
      }
    }
  }

  // Delivery fee
  let deliveryFee = 0;
  if (fulfillmentType === "delivery") {
    deliveryFee = coupon?.freeShipping ? 0 : 15000;
  }

  const total = subtotal - discountAmount + deliveryFee;

  // Generate order code
  const timestamp = Date.now();
  const seq = (await Booking.countDocuments()) + 1;
  const orderCode = `ORD${timestamp}${seq}`;

  const order = await Booking.create({
    orderCode,
    user: req.user._id,
    items: orderItems,
    subtotal,
    discountAmount,
    deliveryFee,
    total,
    fulfillmentType: fulfillmentType || "delivery",
    branch,
    shippingAddress,
    paymentMethod: paymentMethod || "COD",
    coupon: coupon?._id,
    note,
    estimatedDelivery,
    status: ORDER_STATUS.PENDING,
  });

  // Notify admins
  const populatedOrder = await Booking.findById(order._id)
    .populate("user", "name email phone")
    .populate("items.food", "name price images");

  emitToAdmins("newOrder", { order: populatedOrder });

  return res.status(201).json(new ApiResponse(201, order, "Order created successfully"));
});

const getMyOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const query = { user: req.user._id };
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Booking.countDocuments(query);
  const orders = await Booking.find(query)
    .sort("-createdAt")
    .skip(skip)
    .limit(Number(limit))
    .populate("items.food", "name images price")
    .populate("branch", "name address");

  return res.status(200).json(
    new ApiResponse(200, {
      orders,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    })
  );
});

const getOrderDetail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await Booking.findById(id)
    .populate("user", "name email phone")
    .populate("items.food", "name images price category")
    .populate("branch", "name address phone")
    .populate("shipper", "name phone")
    .populate("coupon");

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }

  return res.status(200).json(new ApiResponse(200, order));
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const order = await Booking.findById(id);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  const validNext = VALID_TRANSITIONS[order.status] || [];
  if (!validNext.includes(status)) {
    return res
      .status(400)
      .json({ message: `Cannot transition from ${order.status} to ${status}` });
  }

  order.status = status;
  await order.save();

  const populatedOrder = await Booking.findById(order._id)
    .populate("user", "name email")
    .populate("shipper", "name phone");

  // Notify user
  emitToUser(order.user.toString(), "orderStatusUpdate", {
    orderId: order._id,
    status: order.status,
  });

  // Notify shipper if assigned
  if (order.shipper) {
    emitToUser(order.shipper.toString(), "orderStatusUpdate", {
      orderId: order._id,
      status: order.status,
    });
  }

  // Create notification
  await Notification.create({
    user: order.user,
    type: "order",
    title: "Order Status Updated",
    message: `Your order ${order.orderCode} is now ${status}`,
    data: { orderId: order._id, status },
  });

  return res.status(200).json(new ApiResponse(200, populatedOrder, "Order status updated"));
});

const assignShipper = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { shipperId } = req.body;

  const order = await Booking.findById(id);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  if (order.status !== ORDER_STATUS.CONFIRMED) {
    return res
      .status(400)
      .json({ message: `Shipper can only be assigned to confirmed orders. Current status: ${order.status}` });
  }

  const validNext = VALID_TRANSITIONS[order.status] || [];
  if (!validNext.includes(ORDER_STATUS.PREPARING)) {
    return res
      .status(400)
      .json({ message: `Cannot transition from ${order.status} to preparing` });
  }

  order.shipper = shipperId;
  order.status = ORDER_STATUS.PREPARING;
  await order.save();

  const populatedOrder = await Booking.findById(order._id).populate("shipper", "name phone");

  emitToUser(shipperId, "newDelivery", { order: populatedOrder });

  await Notification.create({
    user: shipperId,
    type: "order",
    title: "New Delivery Assignment",
    message: `You have been assigned to deliver order ${order.orderCode}`,
    data: { orderId: order._id },
  });

  return res.status(200).json(new ApiResponse(200, populatedOrder, "Shipper assigned"));
});

const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await Booking.findById(id);

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  if (order.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }

  const cancellable = [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED];
  if (!cancellable.includes(order.status)) {
    return res.status(400).json({ message: "Order cannot be cancelled at this stage" });
  }

  order.status = ORDER_STATUS.CANCELLED;
  await order.save();

  emitToUser(order.user.toString(), "orderCancelled", {
    orderId: order._id,
    orderCode: order.orderCode,
  });

  return res.status(200).json(new ApiResponse(200, order, "Order cancelled"));
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderDetail,
  updateOrderStatus,
  assignShipper,
  cancelOrder,
};

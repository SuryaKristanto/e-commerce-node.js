const { default: mongoose } = require("mongoose");
const Products = require("../db/schemas/product.schema");
const NewError = require("../helpers/error-stack.helper");
const Orders = require("../db/schemas/order.schema");
const OrderProducts = require("../db/schemas/order_product.schema");
const Users = require("../db/schemas/user.schema");

const createOrder = async (req, res, next) => {
  try {
    const { products, payment_method } = req.body;

    const productCode = products.map((product) => {
      return product.code;
    });

    // check if the product exist
    const existProducts = await Products.find({ _id: { $in: productCode }, deleted_at: null });

    if (existProducts.length !== products.length) {
      throw new NewError(404, "Product not found");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order_no = Math.floor(Math.random() * 1000);

      // insert order document
      const order = await Orders.create({ user_id: req.user_id, order_no: order_no, payment_method: payment_method });

      const totalPrice = [];
      await Promise.all(
        existProducts.map(async (product) => {
          const selectedPayload = products.find((val) => val.code === product._id.toString());

          const deductQty = product.qty - selectedPayload.qty;

          // deduct product qty
          const update = await Products.findByIdAndUpdate(product._id, { qty: deductQty });

          // create order_product document
          const orderProducts = await OrderProducts.create({
            product_code: product._id.toString(),
            order_id: order._id,
            qty_order: selectedPayload.qty,
          });

          const totalPerProduct = selectedPayload.qty * product.price;
          totalPrice.push(totalPerProduct);
        })
      );

      const sum = 0;
      for (let i = 0; i < totalPrice.length; i++) {
        sum += totalPrice[i];
      }

      // update total price in order document
      const updateTotalPrice = await Orders.findOneAndUpdate({ order_no: order_no }, { total_price: sum });

      // Commit the transaction
      await session.commitTransaction();

      console.log("Transaction committed!");
    } catch (error) {
      // Abort the transaction if any error occurred
      await session.abortTransaction();

      console.log("Transaction aborted:", error);
    } finally {
      // End the session after the transaction is completed or aborted
      session.endSession();
    }

    return res.status(201).json({
      message: "Success create order",
    });
  } catch (error) {
    next(error);
  }
};

const orderList = async (req, res, next) => {
  try {
    // find user
    const userId = await Users.findOne({ _id: req.user_id, deleted_at: null });

    // find order and the product
    const orders = await Orders.aggregate([
      {
        $match: {
          deleted_at: null,
          user_id: new mongoose.Types.ObjectId(userId),
          status: { $ne: "FINISHED" },
        },
      },
      {
        $sort: {
          created_at: -1,
        },
      },
      {
        $lookup: {
          from: "order_products",
          localField: "_id",
          foreignField: "order_id",
          as: "order_products",
        },
      },
      {
        $unwind: "$order_products",
      },
      {
        $lookup: {
          from: "products",
          localField: "order_products.product_code",
          foreignField: "_id",
          as: "order_products.product",
        },
      },
      {
        $unwind: "$order_products.product",
      },
      {
        $match: {
          "order_products.product.deleted_at": null,
        },
      },
      {
        $group: {
          _id: "$order_no",
          status: { $first: "$status" },
          total_price: { $first: "$total_price" },
          products: {
            $push: {
              product_code: "$order_products.product_code",
              qty_order: "$order_products.qty_order",
              name: "$order_products.product.name",
              price: "$order_products.product.price",
            },
          },
        },
      },
    ]);

    return res.status(200).json({
      message: "Order List",
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

const orderStatus = async (req, res, next) => {
  try {
    const { id } = req.query;

    // find the order status
    const existOrder = await Orders.findOne({ _id: id, deleted_at: null }, { _id: 0, status: 1 });

    if (!existOrder) {
      throw new NewError(404, "Order not found");
    }

    return res.status(200).json({
      code: 200,
      message: existOrder,
    });
  } catch (error) {
    next(error);
  }
};

const orderHistory = async (req, res, next) => {
  try {
    // find user
    const userId = await Users.findOne({ _id: req.user_id, deleted_at: null });

    // find order and the product
    const orders = await Orders.aggregate([
      {
        $match: {
          deleted_at: null,
          user_id: new mongoose.Types.ObjectId(userId),
          status: { $eq: "FINISHED" },
        },
      },
      {
        $sort: {
          created_at: -1,
        },
      },
      {
        $lookup: {
          from: "order_products",
          localField: "_id",
          foreignField: "order_id",
          as: "order_products",
        },
      },
      {
        $unwind: "$order_products",
      },
      {
        $lookup: {
          from: "products",
          localField: "order_products.product_code",
          foreignField: "_id",
          as: "order_products.product",
        },
      },
      {
        $unwind: "$order_products.product",
      },
      {
        $match: {
          "order_products.product.deleted_at": null,
        },
      },
      {
        $group: {
          _id: "$order_no",
          status: { $first: "$status" },
          total_price: { $first: "$total_price" },
          products: {
            $push: {
              product_code: "$order_products.product_code",
              qty_order: "$order_products.qty_order",
              name: "$order_products.product.name",
              price: "$order_products.product.price",
            },
          },
        },
      },
    ]);

    return res.status(200).json({
      message: "Order List",
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder, orderList, orderStatus, orderHistory };

const express = require("express");

// router
const authenticationRouter = require("./routes/authentication.router");
const productRouter = require("./routes/product.router");
const orderRouter = require("./routes/order.router");
const paymentRouter = require("./routes/payment.router");
const wishlistRouter = require("./routes/wishlist.router");

// logger
const logger = require("./middlewares/errorhandler.middleware");

// mongoose
const mongoose = require("mongoose");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => res.send("Hello World!"));

app.use("", authenticationRouter);
app.use("/product", productRouter);
app.use("/order", orderRouter);
app.use("/payment", paymentRouter);
app.use("/wishlist", wishlistRouter);

// error handler for unknown endpoint
app.use("*", (req, res, next) => {
  return res.status(404).json({
    message: "endpoint not found",
  });
});

// connect to mongodb
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Successfully connected to mongodb"))
  .catch((err) => console.log(err));

// error handler for unexpected error
app.use((err, req, res, next) => {
  logger.error(JSON.stringify(err));
  const status = err.code || 500;
  const message = err.message || "internal server error";

  return res.status(status).json({
    message,
  });
});

module.exports = app;

const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const httpErrors = require("http-errors");
require("dotenv").config();

const connectDB = require("./dbConnect/db");
const db = require("./models");
const ApiRouter = require("./routes/api.route");
const orderRoutes = require("./routes/order.route");
const returnRoutes = require("./routes/returnRequest.route");
const authRoutes=require('./routes/authRoutes')
const notificationRoutes = require('./routes/notificationRoutes');
const reviewRouter = require("./routes/review.route");
const couponRouter = require("./routes/coupon.route");
const addressRoutes = require("./routes/addressRoutes");
const cartRouter = require("./routes/cartRoutes");
const app = express();
app.use(bodyParser.json());
app.use(morgan("dev"));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
   
    next();
});

// app.get("/", async (req, res, next) => {
//     res.status(200).send({ message: "Welcome to Restful API server" });
// });// In your backend server.js or app.js
const cors = require('cors');
app.use(cors());

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to Restful API server' });
});

// API routes
app.use("/auth",authRoutes)
app.use("/", ApiRouter);
app.use("/reviews", reviewRouter);
app.use("/coupons", couponRouter);
app.use("/orders", orderRoutes);
app.use("/returns", returnRoutes);
app.use("/address", addressRoutes);
app.use("/cart", cartRouter);
// Error handling
app.use('/notifications', notificationRoutes);
app.use(async (req, res, next) => {
    next(httpErrors.NotFound("Route not found"));
});

app.use(async (err, req, res, next) => {
    console.error("Server error:", err);
    res.status = err.status || 500;
    res.send({
        "error": {
            "status": err.status || 500,
            "message": err.message
        }
    });
});

const HOST_NAME = process.env.HOST_NAME || 'localhost';
const PORT = process.env.PORT || 9999;

// Kết nối database trước khi khởi động server
connectDB().then(() => {
    app.listen(PORT, HOST_NAME, () => {
        console.log(`Server running at: http://${HOST_NAME}:${PORT}`);
    });
}).catch(err => {
    console.error("Không thể kết nối đến database:", err);
    process.exit(1);
});
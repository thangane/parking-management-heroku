const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const floorRoutes = require('./routes/floor-routes');
const couponRoutes = require('./routes/coupon-routes');
const parkingChargesRoutes = require('./routes/parking-charges-routes');
const parkingTicketRoutes = require('./routes/parking-ticket-routes');
const transactionRoutes = require('./routes/transaction-routes');

let port = process.env.PORT || 3000;


app.use(express.json());
app.use(bodyParser.json());

app.use('/api', floorRoutes.routes);
app.use('/api', couponRoutes.routes);
app.use('/api', parkingChargesRoutes.routes);
app.use('/api', parkingTicketRoutes.routes);
app.use('/api', transactionRoutes.routes);

app.listen(port, () => console.log(`App started and listening on ${port}`));
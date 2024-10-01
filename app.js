const express = require('express');
const path = require('path');
const cookieparser = require('cookie-parser');
const app = express();
const db = require('./config/mongoose-connection');
const ownersRouter = require('./routes/ownersRouter');
const usersRouter = require('./routes/usersRouter');
const productsRouter = require('./routes/productsRouter');
const frontendRouter = require('./routes/frontendRouter');
const index = require('./routes/index');
const expressSession = require('express-session');
const flash = require('connect-flash'); 
const bodyParser = require('body-parser');
const cors = require('cors');
const stripe = require('stripe')('sk_test_51PQOHwGxrk15dGkzNnRQ8CgJUtTyAMu3i3YVJk6ZOUUgh9a8BRDdjcy8hr5k1f9eX0Ot5wBFwZp09lB8VyzJI0Qc00oZIRjYDy');
require("dotenv").config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieparser());
app.use(express.static(path.join(__dirname,"public")));
app.use(expressSession({
    resave:false,
    saveUninitialized: false,
    secret: process.env.EXPRESS_SESSION_SECRET,
}));
app.use(flash());
app.use(bodyParser.json());

app.set('view engine','ejs');

app.use('/',index);
app.use("/owners",ownersRouter);
app.use("/users",usersRouter);
app.use("/products",productsRouter);
app.use('/api',frontendRouter);


app.listen(3000);

if (process.env.NODE_ENV != "production") {
    require("dotenv").config();
}

const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");

const session = require("express-session");

const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const ExpressError = require("./utils/ExpressError");

const listingsRouter = require("./routes/listing");
const reviewsRouter = require("./routes/review");
const userRouter = require("./routes/user");
const MongoStore = require("connect-mongo");



const dbUrl = process.env.ATLASDB_URL;

// ================= DB + SERVER =================
mongoose.connect(dbUrl)
.then(() => {
    console.log("Connected to MongoDB");
    app.listen(8080, () => {
        console.log("Server running on port 8080");
    });
})
.catch(err => console.error(err));

// ================= VIEW ENGINE =================
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ================= MIDDLEWARE =================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: process.env.SECRET
  },
  touchAfter: 24 * 3600
});
store.on("error", (e) => {
    console.log("SESSION STORE ERROR", e);
});


app.use(session({
  
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));



app.use(flash());

// ================= PASSPORT =================
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ================= LOCALS =================
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// ================= ROUTES =================
app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/", userRouter);

// ================= 404 =================
app.all(/(.*)/, (req, res, next) => {
    next(new ExpressError(404, "Page Not Found"));
});

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
    const { statusCode = 500, message = "Something went wrong" } = err;
    res.status(statusCode).render("error", { message });
});

require('dotenv').config();

var express = require("express"),
  app = express(),
  bodyParser = require("body-parser"),
  mongoose = require("mongoose"),
  methodOverride = require("method-override"),
  passport = require("passport"),
  LocalStrategy = require("passport-local"),
  User = require("./models/user"),
  flash = require("connect-flash");

var commentRoutes = require("./routes/comments"),
  campgroundRoutes = require("./routes/campgrounds"),
  indexRoutes = require("./routes/index");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(methodOverride("_method"));
app.use(flash());

const api_key = process.env.GOOGLE_MAPS_API_KEY;

// ============ Connect to Mongo Atlas DB ===============
const db_user = process.env.DB_USER;
const db_pass = process.env.DB_PASS;
const dbURL = "mongodb+srv://" + db_user + ":" + db_pass + "@cluster1-evnyk.mongodb.net/yelpcamp?retryWrites=true&w=majority";
mongoose
  .connect(
    dbURL,
    {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useFindAndModify: false
    }
  )
  .then(client => {
    console.log("Connected to the MongoDB");
  })
  .catch(err => console.log(err));

// ======================================================

// Passport Configuration ===============================
app.use(
  require("express-session")({
    secret: "I like Toyota",
    resave: false,
    saveUninitialized: false
  })
);

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// set currentUser equal to req.user - comming from passport and stores current user information
app.use(function (req, res, next) {
  res.locals.currentUser = req.user;
  res.locals.error = req.flash("error"); // adding flash to all the pages
  res.locals.success = req.flash("success"); // adding flash to all the pages
  next();
});
// ======================================================


// Require route files ================================
app.use(indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);
// ===================================================

app.get("*", function (req, res) {
  res.send("Page not found! You are in star!");
});

app.listen(3000, function () {
  console.log("Connected to the port 3000!");
});

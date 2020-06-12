var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");
var request = require("request");

const maps_key = process.env.GOOGLE_MAPS_API_KEY;


//INDEX ================
router.get("/", function (req, res) {
  Campground.find({}, function (err, allCampgrounds) {
    if (err) {
      console.log(err);
    } else {
      res.render("campgrounds/index", { campgrounds: allCampgrounds });
    }
  });
});

// CREATE ==============
router.post("/", middleware.isLoggedIn, function (req, res) {
  // var name = req.body.name;
  // var image = req.body.image;
  // var description = req.body.description;
  // var newCampground = {name: name, image: image, description: description};

  var author = {
    id: req.user._id,
    username: req.user.username
  };

  Campground.create(req.body.campground, function (err, newlyCreated) {
    if (err) {
      console.log(err);
    } else {
      newlyCreated.author = author;
      // Connect to google maps
      var searchBuilding = newlyCreated.location.building.split(' ').join('+').trim();
      var searchStreet = newlyCreated.location.street.split(' ').join('+').trim();
      var searchCity = newlyCreated.location.city.split(' ').join('+').trim();
      var searchCountry = newlyCreated.location.country.split(' ').join('+').trim();
      var searchPostalCode = newlyCreated.location.postalCode.split(' ').join('+').trim();
      var search = searchBuilding + "%2C" + searchStreet + "%2C" + searchCity + "%2C" + searchCountry + "%2C" + searchPostalCode;
      var url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + search + "&key=" + maps_key;
      console.log(url);
      request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          // translate address into Lat and Lng
          var data = JSON.parse(body)
          console.log(data);
          newlyCreated.formattedAddress = data.results[0].formatted_address;
          newlyCreated.location.latitude = data.results[0].geometry.location.lat;
          newlyCreated.location.longitude = data.results[0].geometry.location.lng;
          newlyCreated.save();
          console.log(newlyCreated);
        } else {
          console.log(error);
        }
      })
      res.redirect("/campgrounds");
    }
  });
});

// NEW =================
router.get("/new", middleware.isLoggedIn, function (req, res) {
  res.render("campgrounds/new");
});

// SHOW ===================
router.get("/:id", function (req, res) {
  Campground.findById(req.params.id)
    .populate("comments")
    .exec(function (err, foundCampground) {
      if (err) {
        console.log(err);
      } else {
        res.render("campgrounds/show", { campground: foundCampground });
      }
    });
  req.params.id;
});

// Edit campground route and check authorisation
router.get("/:id/edit", middleware.checkCampgroundOwnership, function (
  req,
  res
) {
  Campground.findById(req.params.id, function (err, foundCampground) {
    res.render("campgrounds/edit", { campground: foundCampground });
  });
});

// Update campground route
router.put("/:id", middleware.checkCampgroundOwnership, function (req, res) {
  //find and update the campground
  Campground.findByIdAndUpdate(req.params.id, req.body.campground, function (
    err,
    updatedCampground
  ) {
    if (err) {
      res.redirect("/campgrounds");
    } else {
      var searchBuilding = updatedCampground.location.building.split(' ').join('+').trim();
      var searchStreet = updatedCampground.location.street.split(' ').join('+').trim();
      var searchCity = updatedCampground.location.city.split(' ').join('+').trim();
      var searchCountry = updatedCampground.location.country.split(' ').join('+').trim();
      var searchPostalCode = updatedCampground.location.postalCode.split(' ').join('+').trim();
      var search = searchBuilding + "%2C" + searchStreet + "%2C" + searchCity + "%2C" + searchCountry + "%2C" + searchPostalCode;
      var url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + search + "&key=" + maps_key;
      console.log(url);
      request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          // translate address into Lat and Lng
          var data = JSON.parse(body)
          console.log(data);
          updatedCampground.formattedAddress = data.results[0].formatted_address;
          updatedCampground.location.latitude = data.results[0].geometry.location.lat;
          updatedCampground.location.longitude = data.results[0].geometry.location.lng;
          updatedCampground.save();
          console.log(Campground);
          //redirect to the campground
          res.redirect("/campgrounds/" + req.params.id);
        }
      });
    };
  });
});

// Destroy campground route
router.delete("/:id", middleware.checkCampgroundOwnership, function (req, res) {
  Campground.findByIdAndRemove(req.params.id, function (err) {
    if (err) {
      res.redirect("/campgrounds");
    } else {
      res.redirect("/campgrounds");
    }
  });
});

module.exports = router;

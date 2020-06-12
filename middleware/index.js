var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middlewareObj = {};

middlewareObj.checkCampgroundOwnership = function (req, res, next) {
  if (req.isAuthenticated()) {
    Campground.findById(req.params.id, function (err, foundCampground) {
      if (err) {
        req.flash("error", "Campground not found");
        res.redirect("back");
      } else {
        // compare author and current user as req.user is String and author ID is object from Mongo DB and you cannot use === for comparing
        if (foundCampground.author.id.equals(req.user._id) || req.user.isAdmin) {
          next();
        } else {
          req.flash("error", "you don`t have permission to do that");
          res.redirect("back");
        }
      }
    });
  } else {
    req.flash("error", "You need to be loggen in to do that!");
    res.redirect("back");
  }
};

middlewareObj.checkCommentOwnership = function checkCommentOwnership(req, res, next) {
  if (req.isAuthenticated()) {
    Comment.findById(req.params.comment_id, function (err, foundComment) {
      if (err) {
        req.flash("error", "Comment is not found");
        res.redirect("back");
      } else {
        // compare author and current user as req.user is String and author ID is object from Mongo DB and you cannot use === for comparing
        if (foundComment.author.id.equals(req.user._id) || req.user.isAdmin) {
          next();
        } else {
          res.redirect("back");
        }
      }
    });
  } else {
    req.flash("error", "You need to be loggen in to do that!");
    res.redirect("back");
  }
};

// check if user is logged in
middlewareObj.isLoggedIn = function (req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("error", "You need to be loggen in to do that!");
  res.redirect("/login");
};

module.exports = middlewareObj;

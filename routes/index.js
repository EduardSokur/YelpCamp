var express = require("express"),
  router = express.Router(),
  passport = require("passport"),
  async = require("async"),
  nodemailer = require("nodemailer"),
  crypto = require("crypto"),
  User = require("../models/user");

// INDEX =============
router.get("/", function (req, res) {
  res.render("landing");
});

// show register form
router.get("/register", function (req, res) {
  res.render("register");
});

// register new user
router.post("/register", function (req, res) {
  var newUser = new User(req.body.user);
  User.register(newUser, req.body.user.password, function (err, newlyCreatedUser) {
    if (err) {
      req.flash("error", err.message);
      return res.redirect("/register");
    }
    passport.authenticate("local")(req, res, function () {
      req.flash("success", "Welcome to YelpCamp " + newlyCreatedUser.username);
      res.redirect("/campgrounds");
    });
  });
});

// user login
router.get("/login", function (req, res) {
  res.render("login", { page: "login" });
});

router.post("/login", passport.authenticate("local", { successRedirect: "/campgrounds", failureRedirect: "/login" }), function (req, res) { }
);

router.get("/logout", function (req, res) {
  req.logout();
  req.flash("success", "You`ve successfully logged out");
  res.redirect("/campgrounds");
});

//forgot password route 
router.get("/forgot", function (req, res) {
  res.render("forgot");
})

router.post("/forgot", function (req, res) {
  async.waterfall([
    //create a token
    function (done) {
      crypto.randomBytes(20, function (err, buf) {
        var token = buf.toString("hex");
        done(err, token);
      });
    },
    // find email address
    function (token, done) {
      User.findOne({ email: req.body.email }, function (err, user) {
        if (!user) {
          req.flash("error", "No accound with that email address exists.");
          return res.redirect("/forgot");
        }
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour in ms

        user.save(function (err) {
          done(err, token, user);
        });
      });
    },
    //send email to the user
    function (token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        host: 'mail.gmx.net',
        port: 587,
        tls: {
          ciphers: 'SSLv3',
          rejectUnauthorized: false
        },
        auth: {
          user: 'sokur.eduard@gmx.de',
          pass: process.env.EMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'sokur.eduard@gmx.de',
        subject: 'Password Reset YelpCamp',
        html: '<p><b>Hello to myself!</b></p> <p>You are receiving this because for your account the reset of the password has been requested.<br>Please click on the following link, or paste this into your browser to complete the process.</p><br><p>http://localhost:3000/reset/' + token + '</p><br><p>If you did not request this, please ignore this email and your password will remain unchanged.</p>',
        list: {
          // List-Help: <mailto:admin@example.com?subject=help>
          help: 'admin@example.com?subject=help',

          // List-Unsubscribe: <http://example.com> (Comment)
          unsubscribe: [
            {
              url: 'http://example.com/unsubscribe',
              comment: 'A short note about this url'
            },
            'unsubscribe@example.com'
          ]
        }
      };
      smtpTransport.sendMail(mailOptions, function (error) {
        console.log("mail sent");
        req.flash("success", "An email has been sent to " + user.email + " with further instructions.");
        done(error, "done");
      });
    }
  ], function (err) {
    if (err) {
      console.log(err);
      res.redirect("/forgot");
      // return next(err);
    }
  });
});

//reset password route

router.get("/reset/:token", function (req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() - 3600000 } }, function (err, user) {
    if (!user) {
      req.flash("error", "Password reset link is invalid or has expired.");
      return res.redirect("/forgot");
    }
    res.render("reset", { token: req.params.token });
  })
})

router.post("/reset/:token", function (req, res) {
  async.waterfall([
    function (done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() - 3600000 } }, function (err, user) {
        if (!user) {
          req.flash("error", "Password reset link is invalid or has expired.");
          return res.redirect("back");
        }
        if (req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function (err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            //login user
            user.save(function (err) {
              req.logIn(user, function (err) {
                done(err, user);
              });
            });
          })
        } else {
          req.flash("error", "Password do not match");
          return res.redirect("back");
        }
      });
    },
    function (user, done) {
      var smtpTransport = nodemailer.createTransport({
        host: 'mail.gmx.net',
        port: 587,
        tls: {
          ciphers: 'SSLv3',
          rejectUnauthorized: false
        },
        auth: {
          user: 'sokur.eduard@gmx.de',
          pass: process.env.EMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'sokur.eduard@gmx.de',
        subject: 'Your Password Has Been Changed',
        html: '<p><b>Hello, </b></p> <p>This is a confirmation that the password for your account ' + user.email + ' has just been updated</p>',
        list: {
          // List-Help: <mailto:admin@example.com?subject=help>
          help: 'admin@example.com?subject=help',

          // List-Unsubscribe: <http://example.com> (Comment)
          unsubscribe: [
            {
              url: 'http://example.com/unsubscribe',
              comment: 'A short note about this url'
            },
            'unsubscribe@example.com'
          ]
        }
      };
      smtpTransport.sendMail(mailOptions, function (error) {
        console.log("mail sent");
        req.flash("success", "Your password has been successfully changed!");
        done(error, "done");
      });
    }
  ], function (err) {
    res.redirect("/campgrounds");
  });
});

module.exports = router;

var mongoose = require("mongoose");

var campgroundSchema = new mongoose.Schema({
  name: String,
  price: String,
  image: String,
  description: String,
  location: {
    street: String,
    building: String,
    city: String,
    country: String,
    postalCode: String,
    latitude: Number,
    longitude: Number
  },
  formattedAddress: String,
  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    username: { type: String, default: "NA" }
  },
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment"
    }
  ]
});

module.exports = mongoose.model("Campground", campgroundSchema);

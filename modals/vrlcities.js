const mongoose = require("mongoose");

const { Schema } = mongoose;

const vrlcitySchema = new Schema(
  {
    CityID: {
      type: String,
    },
    CityName: {
      type: String
    }
  }
);

module.exports = mongoose.model("VrlCity", vrlcitySchema);


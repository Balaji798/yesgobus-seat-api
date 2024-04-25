const mongoose = require("mongoose");

const { Schema } = mongoose;

const srsCitySchema = new Schema(
  {
    id: {
      type: Number,
    },
    name: {
      type: String
    },
    origin_count: {
      type: Number,
    },
    destination_count: {
      type: Number,
    }
  }
);

module.exports = mongoose.model("SrsCity", srsCitySchema);

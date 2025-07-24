const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define schema
const categorySchema = new Schema({
  name: { type: String, required: [true, "Name is required"] },
  description: { type: String },
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;

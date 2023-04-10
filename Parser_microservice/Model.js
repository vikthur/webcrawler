const mongoose = require('mongoose');

// Define a Mongoose schema for the pages collection
const pageSchema = new mongoose.Schema({
    url: { type: String, required: true },
    title: { type: String },
    header: { type: String },
    urls: [{ type: String }],
});

// Define a Mongoose model for the pages collection
const Page = mongoose.model('Page', pageSchema);

module.exports = { Page }

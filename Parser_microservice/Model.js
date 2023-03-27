const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const urlSchema = new mongoose.Schema(
  {
    rootUrl: {
      type: String,
    },

    sourceUrl: {
      type: String,
    },

    url: {
      type: String,
    },

    pageTitle: {
      type: String,
    },

    pageContent: {
      type: String,
    },
  },
  { timestamps: true }
);

mongoose.model("UrlObj", urlSchema);

const rooturlSchema = new mongoose.Schema(
  {
    rootUrl: {
      type: Array,
      required: true,
    },
  },
  { timestamps: true }
);

export const URL = mongoose.model("UrlObj", urlSchema);
export const ROOTURL = mongoose.model("RootUrlObj", rooturlSchema);
module.exports = { URL, ROOTURL };

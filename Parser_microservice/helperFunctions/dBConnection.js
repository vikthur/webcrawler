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
    },
  },
  { timestamps: true }
);

mongoose.model("RootUrlObj", rooturlSchema);

class dbManager {
  connectToDb() {
    mongoose
      .connect(
        `mongodb+srv://victor_3d:${process.env.DB_PWD}@cluster0.9jmrg9q.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
        {
          useUnifiedTopology: true,
          useNewUrlParser: true,
        }
      )
      .then(() => {
        console.log("db connection successful");
      })
      .catch((err) => console.log(err));
  }

  async saveToDb(payLoad) {
    try {
      const url = new UrlObj({
        rootUrl: payLoad.rootUrl,
        sourceUrl: payLoad.sourceUrl,
        url: payLoad.url,
        pageTitle: payLoad.pageTitle,
        pageContent: payLoad.pageContent,
      });
      await url.save();

      return true;
    } catch (error) {
      console.log(error);

      return false;
    }
  }

  async getAll() {
    try {
      const urls = await UrlObj.find();
      return urls;
    } catch (error) {
      console.log(error);

      return false;
    }
  }

  dbTimeout() {}
}

module.exports = dbManager;

var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.connect("mongodb://abramwingle:@Abram111@ds149146.mlab.com:49146/heroku_mt08rpg3", { useNewUrlParser: true });

// Routes

app.get("/scrape", function(req, res) {

  console.log("scrape function is being run");

  axios.get("https://www.foxnews.com/").then(function(response) {
    var $ = cheerio.load(response.data);
  
    $("h2.title").each(function(i, element) {
      var result = {};
      
      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");
     
      db.article.create(result)
        .then(function(dbArticle) {
          console.log(dbArticle);
        })
        .catch(function(err) {
          console.log(err);
        });
    });

    res.send("Scrape Complete");
  });
});

app.get("/articles", function(req, res) {
  db.article.find({})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.get("/articles/:id", function(req, res) {
  db.article.findOne({ _id: req.params.id })
    .populate("note")
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.post("/articles/:id", function(req, res) {
  db.Note.create(req.body)
    .then(function(dbNote) {
      
      return db.article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});


app.get("/api/delete", function(req, res) {
  
  mongoose.connection.db.dropDatabase();

  res.end();


});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
 
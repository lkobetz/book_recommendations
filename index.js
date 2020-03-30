const request = require("request");
const cheerio = require("cheerio");

request(
  "https://www.goodreads.com/book/show/11866694-arcadia?ac=1&from_search=true&qid=VRQIpB3QKE&rank=2",
  (error, response, html) => {
    if (!error && response.statusCode == 200) {
      const wholePage = cheerio.load(html);
      const allReviews = wholePage(".review");
      const reviewsArr = Array.from(allReviews);
      reviewsArr.forEach(review => {
        console.log(review.children[3].attribs.title);
      });
    }
  }
);

// need div id = bookReviews

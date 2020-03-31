const request = require("request");
const cheerio = require("cheerio");

request(
  "https://www.goodreads.com/book/show/11866694-arcadia?ac=1&from_search=true&qid=VRQIpB3QKE&rank=2",
  (error, response, html) => {
    if (!error && response.statusCode == 200) {
      const wholePage = cheerio.load(html);
      const allReviews = wholePage(".review");
      let reviewsArr = Array.from(allReviews);
      reviewsArr = reviewsArr.filter(review => {
        // 5 is left bodycol // 1 is reviewHeader // 5 is rating
        return (
          review.children[5].children[1].children[5].attribs.title ===
          "it was amazing"
        );
      });
      const authorIds = [];
      reviewsArr.forEach(review => {
        let end = review.children[3].attribs.href.indexOf("-");
        // the third child of the review contains review author info
        authorIds.push(review.children[3].attribs.href.slice(11, end));
      });
      console.log(authorIds);
    }
  }
);

// need div id = bookReviews

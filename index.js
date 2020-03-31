const request = require("request");
const cheerio = require("cheerio");
const rp = require("request-promise");

const authorIds = [];

const optionsReviews = {
  uri:
    "https://www.goodreads.com/book/show/29906980-lincoln-in-the-bardo?ac=1&from_search=true&qid=sUpwev6tfA&rank=1",
  transform: function(html) {
    return cheerio.load(html);
  }
};

function makeRequest(options) {
  return rp(options)
    .then($ => {
      return $;
    })
    .catch(err => {
      console.log(err);
    });
}

async function getReviewerIds() {
  const $ = await makeRequest(optionsReviews);
  const allReviews = await $(".review");
  let reviewsArr = Array.from(allReviews);
  reviewsArr = reviewsArr.filter(review => {
    // 5 is left bodycol // 1 is reviewHeader // 5 is rating
    if (review.children[5].children[1].children[5]) {
      return (
        review.children[5].children[1].children[5].attribs.title ===
        "it was amazing"
      );
    }
  });
  reviewsArr.forEach(review => {
    let end = review.children[3].attribs.href.indexOf("-");
    // the third child of the review contains review author info
    authorIds.push(review.children[3].attribs.href.slice(11, end));
  });

  return authorIds;
}

let all5Stars = { total: 0, books: {} };
let multiples = {};
let singles = new Set();

async function getBookRecs(authorIds) {
  for (let i = 0; i < authorIds.length; i++) {
    let id = authorIds[i];
    // let id = 1213607;
    const $ = await makeRequest({
      uri: `https://www.goodreads.com/review/list/${id}?shelf=read&sort=rating`,
      transform: function(html) {
        return cheerio.load(html);
      }
    });
    const allTitles = await $(".field.title");
    allTitlesArr = Array.from(allTitles);
    allTitlesArr.forEach(title => {
      all5Stars.total++;
      if (title.children[1].children[1]) {
        let book = title.children[1].children[1].attribs.href;
        if (!(book in all5Stars.books)) {
          all5Stars.books[book] = 1;
        } else {
          if (!(book in multiples)) {
            multiples[book] = 1;
          } else {
            multiples[book]++;
          }
        }
      } else {
        all5Stars[id] = "no books";
      }
    });
  }
  for (let title in all5Stars.books) {
    if (!(title in multiples)) {
      singles.add(title);
    }
  }
  return { multiples, singles };
}

async function sortRecs(allBooks) {
  sortByAvgRating(Array.from(allBooks.singles));
}

async function sortByAvgRating() {
  // for (let i = 0; i < booksArr.length; i++) {
  let first = "/book/show/13023.Alice_in_Wonderland";
  const $ = await makeRequest({
    uri: `https://www.goodreads.com${first}`,
    transform: function(html) {
      return cheerio.load(html);
    }
  });
  let ratingContainer = $("#bookMeta");
  // .find("[itemprop=ratingValue]")
  const rating = Number(ratingContainer[0].children[5].children[0].data);
  console.log(rating);

  // }
}

sortByAvgRating();

// call all functions
// getReviewerIds().then(result =>
//   getBookRecs(result).then(result => sortRecs(result))
// );

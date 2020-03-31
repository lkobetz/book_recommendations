const request = require("request");
const cheerio = require("cheerio");
const rp = require("request-promise");

function makeRequest(options) {
  return rp(options)
    .then($ => {
      return $;
    })
    .catch(err => {
      console.log(err);
    });
}

const optionsReviews = {
  uri:
    "https://www.goodreads.com/book/show/15823480-anna-karenina?ac=1&from_search=true&qid=sUpwev6tfA&rank=1",
  transform: function(html) {
    return cheerio.load(html);
  }
};

const authorIds = [];

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
    allTitlesArr = Array.from(allTitles).slice(0, 30);
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

let sortedByVoteMultiples = [
  ["/book/show/1885.Pride_and_Prejudice", 3],
  ["/book/show/89717.The_Haunting_of_Hill_House", 1],
  ["/book/show/5107.The_Catcher_in_the_Rye", 1],
  ["/book/show/4671.The_Great_Gatsby", 1],
  ["/book/show/23878.Chronicle_of_a_Death_Foretold", 1],
  ["/book/show/4395.The_Grapes_of_Wrath", 1],
  ["/book/show/5685.Anna_Karenina", 1],
  ["/book/show/4900.Heart_of_Darkness", 1],
  ["/book/show/1519.The_Oresteia", 1],
  [
    "/book/show/17876.Notes_from_Underground_White_Nights_The_Dream_of_a_Ridiculous_Man_and_Selections_from_The_House_of_the_Dead",
    1
  ]
];
async function sortRecs() {
  // let singles = Array.from(allBooks.singles).slice(0, 100);
  // let sortedSingles = await sortByAvgRating(singles);
  // let sortedByVoteMultiples = Object.entries(allBooks.multiples).sort(
  //   (a, b) => b[1] - a[1]
  // );
  debugger;
  let multiplesByVoteAndRating = [];
  let sameNumOfVotes = [];
  for (let i = 0; i < sortedByVoteMultiples.length; i++) {
    let previous = sortedByVoteMultiples[i - 1] || false;
    let current = sortedByVoteMultiples[i];
    let next = sortedByVoteMultiples[i + 1] || false;
    if (
      (next[1] < current[1] && previous[1] === current[1]) ||
      next === false
    ) {
      sameNumOfVotes = sameNumOfVotes.concat(current[0]);
      let sortedSameNumOfVotes = await sortByAvgRating(sameNumOfVotes);
      multiplesByVoteAndRating = multiplesByVoteAndRating.concat(
        sortedSameNumOfVotes
      );
      sameNumOfVotes = [];
    } else if (next[1] === current[1]) {
      sameNumOfVotes = sameNumOfVotes.concat(current[0]);
    } else if (next[1] < current[1]) {
      multiplesByVoteAndRating = multiplesByVoteAndRating.concat(current[0]);
    }
  }
  console.log(multiplesByVoteAndRating);
}

async function sortByAvgRating(booksArr) {
  let sortedArr = [];
  for (let i = 0; i < booksArr.length; i++) {
    let current = booksArr[i];
    const $ = await makeRequest({
      uri: `https://www.goodreads.com${current}`,
      transform: function(html) {
        return cheerio.load(html);
      }
    });
    let ratingContainer = $("#bookMeta");
    const rating = Number(ratingContainer[0].children[5].children[0].data);
    sortedArr.push([current, rating]);
  }
  sortedArr.sort((a, b) => b[1] - a[1]);
  sortedArr = sortedArr.slice(0, 50);
  return sortedArr;
}

sortRecs();

// call all functions
// getReviewerIds().then(result =>
//   getBookRecs(result).then(result => sortRecs(result))
// );

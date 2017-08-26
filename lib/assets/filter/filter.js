import _badWords from './profane.json';

class Filter {
  constructor() {}

  prepText(text) {
    // compress text to single string with no symbols
    return text
      .replace(/[^A-Za-z|0-9]/g, ' ')
      .replace(/\s+/g,'')
      .trim()
      .toLowerCase();
  }

  scoreText(text, verifyCb) {

    const prepedText = this.prepText(text);

    const badWords = Object.keys(_badWords);

    // iterate through bad words
    // use regex to match innapropriate words.
    const scoreCard = badWords.reduce((card, phrase) => {
      const match = prepedText.match(new RegExp('(' + phrase + ')'));

      if (match) {
        const categories = _badWords[match[0]]
        categories.forEach(cat => card[cat] = card[cat] + 1 || 1)
      }

      return card;
    }, {})

    if (scoreCard.inappropriate > 0) {
      verifyCb(false, Object.keys(scoreCard));
    } else if (scoreCard.sexual > 0) {
      verifyCb(false, Object.keys(scoreCard));
    } else if (scoreCard.drugs > 0) {
      verifyCb(false, Object.keys(scoreCard));
    } else if (scoreCard['drugs-slang'] > 2) {
      verifyCb(false, Object.keys(scoreCard));
    } else if (scoreCard.insult > 2) {
      verifyCb(false, Object.keys(scoreCard));
    } else {
      verifyCb(true, 'passes all tests');
    }
  }

  init(text, cb) {
    this.scoreText(text, cb);
  }
}

const filter = new Filter();
export default filter.init.bind(filter);
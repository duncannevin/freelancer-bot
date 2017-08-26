import { _ } from 'lodash';

export default (direction) => {
  const baseStages = {
    work: ['Browse jobs', 'Post a product'],
    hire: ['Browse products', 'Post a job'],
    home: ['I\'m looking for work', 'I\'m looking to hire', 'Check your posts', 'Check your awarded'],
  }

  // for filters
  if (direction === 'dump') {
    const priceRanges = require('./price_ranges');
    const productPrices = require('./product_prices');

    return _.flattenDeep([
      _.flatten(_.values(baseStages)),
      _.values(priceRanges),
      _.values(productPrices),
    ]);
  }

  let allStages = baseStages[direction];

  if (direction !== 'home') {
    allStages = allStages.concat(['Main menu']);
  }

  return allStages;
}
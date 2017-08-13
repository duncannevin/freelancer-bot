export default (direction) => {
  const baseStages = {
    work: ['Browse jobs', 'Post a product'],
    hire: ['Browse products', 'Post a job'],
    home: ['I\'m looking for work', 'I\'m looking to hire', 'Check your posts', 'Check your awarded'],
  }
  let allStages = baseStages[direction];
  if (direction !== 'home') {
    allStages = allStages.concat(['Main menu']);
  }

  return allStages;
}
import State from './State.model';

export default {
  findOrCreate(chatId, cb) {
    State.findOrCreate({chatId: chatId})
      .then(data => {
        cb(null, data);
      })
      .catch(err => {
        cb(err, null);
      });
  },

  updateStage(chatId, updated, cb) {
    State.update({chatId: chatId}, updated)
      .then(data => {
        cb(null, data);
      })
      .catch(err => {
        cb(err, null);
      });
  },
}
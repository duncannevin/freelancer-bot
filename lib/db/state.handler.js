import { _ } from 'lodash';

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

  getState(chatId, cb) {
    State.find({chatId: chatId})
      .then(data => {
        cb(null, data);
      })
      .catch(err => {
        cb(err, null);
      });
  },

  updateSubStage(chatId, subStage, data, cb) {
    State.update({chatId: chatId}, {
      subStage: subStage, $push: {subStageData: data}
    })
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

  deleteChat(chatId, cb) {
    State.deleteOne(chatId)
      .then(data => {
        cb(null, data);
      })
      .catch(err => {
        cb(err, null);
      });
  },

  setAllowAnything(chatId, bool, cb) {
    State.update({chatId: chatId}, {allowAnything: bool})
      .then(data => {
        cb(null, data);
      })
      .catch(err => {
        cb(err, null);
      });
  },

  resetState(chatId, cb) {
    State.update({chatId: chatId}, {
      stage: 'welcome',
      subStage: 0,
      $set: {subStageData: []},
      allowAnything: false,
    })
      .then(data => {
        cb(null, data);
      })
      .catch(err => {
        cb(err, null)
      });
  },
}






import { _ } from 'lodash';

import State from './State.model';

export default {
  getAllStates(cb) {
    State.find({})
      .then(data => {
        cb(null, data);
      })
      .catch(err => {
        cb(err, null);
      })
  },

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

  updateSubStagePost(chatId, subStage, data, cb) {
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

  updateSubStageBrowse(chatId, {subStage, postShowing}, cb) {
    State.update({chatId: chatId}, {
      subStage: subStage,
      postShowing: postShowing,
    })
      .then(data => {
        cb(null, data);
      })
      .catch(err => {
        cb(err, null);
      });
  },

  addSubStageDataBrowse(chatId, subStageData, cb) {
    State.update({chatId: chatId}, {
       $set: {subStageData: subStageData},
    })
      .then(data => {
        cb(null, data);
      })
      .catch(err => {
        cb(err, null);
      });
  },

  addSubStageDataContact(chatId, {subStage, subStageData}, cb) {
    State.update({chatId: chatId}, {
      subStage: subStage,
      $set: {subStageData: subStageData},
    })
      .then(data => {
        cb(null, data);
      })
      .catch(err => {
        cb(err, null);
      });
  },

  updateSubStageContact(chatId, {subStage, subStageData}, cb) {
    State.update({chatId: chatId}, {
      subStage: subStage,
      $push: {subStageData: subStageData},
    })
      .then(data => {
        cb(null, data);
      })
      .catch(err => {
        cb(err, null);
      });
  },

  addSubStageDataQuotes(chatId, subStage, subStageData, cb) {
    State.update({chatId: chatId}, {
      subStage: subStage,
      $set: {subStageData: subStageData},
    })
      .then(data => {
        cb(null, data);
      })
      .catch(err => {
        cb(err, null);
      });
  },

  updateSubStageQuotes(chatId, {subStage, postShowing}, cb) {
    State.update({chatId: chatId}, {
      subStage: subStage,
      postShowing: postShowing,
    })
      .then(data => {
        cb(null, data);
      })
      .catch(err => {
        cb(err, null);
      });
  },

  updateSubStageAward(chatId, {subStage, postShowing}, cb) {
    State.update({chatId: chatId}, {
      subStage: subStage,
      postShowing: postShowing,
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
    State.deleteOne({chatId: chatId})
      .then(data => {
        cb(null, data);
      })
      .catch(err => {
        console.log(err.message);
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






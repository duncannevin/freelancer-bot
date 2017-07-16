import db from './db.config';
import findOrCreate from 'findorcreate-promise';

let StateSchema = new db.Schema({
  chatId: {
    type: String,
    required: true,
  },
  username: {
    type: String,
  },
  stage: {
    type: String,
  },
  subStage: {
    type: Number,
  },
  subStageData: {
    type: Array,
  }
}, {
  timestamps: true,
});

StateSchema.plugin(findOrCreate);

let State = db.model('State', StateSchema);

export default State;


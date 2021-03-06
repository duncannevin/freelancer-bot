import db from './db.config';
import findOrCreate from 'findorcreate-promise';

let StateSchema = new db.Schema({
  direction: {
    type: String,
    default: 'home',
  },
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
    default: 0,
  },
  subStageData: {
    type: Array,
  },
  allowAnything: {
    type: Boolean,
    default: false,
  },
  postShowing: {
    type: String,
  },
}, {
  timestamps: true,
});

StateSchema.plugin(findOrCreate);

let State = db.model('State', StateSchema);

export default State;


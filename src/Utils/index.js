import CharGenerator from './char-generator';
import _ from 'lodash';

global.Promise.start = global.Promise.prototype.start = function () {
  return new Promise(resolve => resolve());
}

export default {
  CharGenerator,
  _,
};

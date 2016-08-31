var chai = require('chai');
var expect = chai.expect;

import Utils from '../src/Utils';

describe('Utils', () => {
  describe('CharGenerator', () => {
    it('should return a character starting with "a"', () => {
      Utils.CharGenerator.start('a');
      const char = Utils.CharGenerator.next();
      expect(char).to.equal('a');
    });

    it('should only return characters', () => {
      for (let i = 0; i < 1000; i++) {
        const char = Utils.CharGenerator.next();
        expect(char).to.match(/^[a-z]+$/);
      }
    });
  });
});

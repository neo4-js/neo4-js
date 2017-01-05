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

    it('should only return characters', function(done) {
      this.timeout(5000);
      // 26^4 < 500000
      for (let i = 0; i < 500000; i++) {
        const char = Utils.CharGenerator.next();
        expect(char).to.match(/^[a-z]+$/);
      }
      done();
    });
  });
});

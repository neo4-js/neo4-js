var chai = require('chai');
var expect = chai.expect;

import serverHelper from '../server-helper';

const schema = {
  text: {},
};
let neo4js;
let DbModel;

describe('count', function() {
  before(() => {
    neo4js = serverHelper.getNeo4jsInstance();
    DbModel = neo4js.define('Count', schema);
    return neo4js.sync()
      .then(() => DbModel.create({ text: 'asdf' }))
      .then(() => DbModel.create({ text: 'foo' }))
      .then(() => DbModel.create({ text: 'foo' }));
  });

  it('should return a promise', function() {
    expect(DbModel.count({ text: 'asdf' })).to.be.instanceof(Promise);
  });

  it('should return 2 objects', function() {
    return DbModel.count({ text: 'foo' })
      .then(n => {
        expect(n).to.equal(2);
      });
  })
});

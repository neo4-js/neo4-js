var chai = require('chai');
var expect = chai.expect;

import serverHelper from '../server-helper';
import Neo4js from '../../src/neo4js';

const schema = {
  text: {},
};
let neo4js;
let DbModel;

describe('find', function() {
  before(() => {
    neo4js = serverHelper.getNeo4jsInstance();
    DbModel = neo4js.define('Find', schema);
    return neo4js.sync()
      .then(() => DbModel.create({ text: 'asdf' }))
      .then(() => DbModel.create({ text: 'foo' }))
      .then(() => DbModel.create({ text: 'foo' }));
  });

  it('should return a promise', function() {
    expect(DbModel.find({ text: 'asdf' })).to.be.instanceof(Promise);
  });

  it('should return an array of objects', function() {
    return DbModel.find()
      .then(objects => {
        expect(objects).to.be.instanceof(Array);
      });
  });

  it('should return all 3 created objects', function() {
    return DbModel.find()
      .then(objects => {
        expect(objects.length).to.equal(3);
      });
  });

  it('should return exactly one object with text = "foo"', function() {
    return DbModel.find({ text: 'foo' })
      .then(objects => {
        expect(objects.length).to.equal(2);
      });
  });
});

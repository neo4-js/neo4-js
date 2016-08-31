var chai = require('chai');
var expect = chai.expect;

import serverHelper from '../server-helper';
import Neo4js from '../../src/neo4js';

const schema = {
  text: {},
};
let neo4js;
let DbModel;

describe('findOne', function() {
  before(() => {
    neo4js = serverHelper.getNeo4jsInstance();
    DbModel = neo4js.define('FindOne', schema);
    return neo4js.sync()
      .then(() => DbModel.create({ text: 'asdf' }))
      .then(() => DbModel.create({ text: 'foo' }));
  });

  it('should return a promise', function() {
    expect(DbModel.findOne({ text: 'asdf' })).to.be.instanceof(Promise);
  });

  it('should return exactly one object', function() {
    return DbModel.findOne()
      .then(object => {
        expect(object).to.be.instanceof(Object);
      })
      .catch(err => {
        console.log(err.message);
      });
  });

  it('should return exactly one object', function() {
    return DbModel.findOne()
      .then(object => {
        expect(object).to.have.keys(['text']);
      });
  });

  it('should return exactly one object with text = "foo"', function() {
    return DbModel.findOne({ text: 'foo' })
      .then(object => {
        expect(object.text).to.equal('foo');
      });
  });
});

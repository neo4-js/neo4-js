var chai = require('chai');
var expect = chai.expect;

import serverHelper from '../server-helper';
import Neo4js from '../../src/neo4js';

const schema = {
  text: {}
};
let neo4js;
let DbModel;

describe('create', function() {
  beforeEach(() => {
    neo4js = serverHelper.getNeo4jsInstance();
    DbModel = neo4js.getModel('Create');
    if (!DbModel) {
      DbModel = neo4js.define('Create', schema);
    }
    return DbModel.sync();
  });

  it('should return an object with keys text', function() {
    return DbModel.create({ text: 'asdf' })
      .then(object => {
        expect(object).to.have.keys(['text']);
      })
      .catch(err => {
        expect(err).to.be.null;
      });
  });

  it('should return an error when breaking the unique constraint', function() {
    return DbModel.create({ text: 'foo' })
      .then(object => {
        return DbModel.create(object)
      })
      .catch(err => {
        expect(err).to.be.instanceof(Error);
      });
  });

  it('should return a promise', function() {
    expect(DbModel.create({ text: 'bar' })).to.be.instanceof(Promise);
  });
});

var chai = require('chai');
var expect = chai.expect;

import serverHelper from './server-helper';

import Neo4js from '../src/neo4js';
const Model = Neo4js.Model;

const neo4js = serverHelper.getNeo4jsInstance();

const userSchema = {
  guid: {
    index: true,
    defaultValue: neo4js.uuid4,
  },
  name: {
    unique: true,
    exists: true,
  },
};

describe('Neo4js', () => {
  describe('define', () => {
    it ('should return a Model object', () => {
      const User = neo4js.define('User', userSchema);

      expect(User).to.be.instanceof(Model);
      expect(User).to.have.property('name');
      expect(User).to.have.property('labels');
      expect(User.labels).to.be.instanceof(Array);
      expect(typeof User.create).to.equal('function');
    });
  });

  describe('getSchemaInfo', () => {
    beforeEach(() => {
      return neo4js.drop();
    });

    it('should return no schema at all', () => {
      return neo4js.getSchemaInfo()
        .then((schemaInfo) => {
          expect(schemaInfo).to.eql({});
        });
    });

    it('should return the schema synced', () => {
      const User = neo4js.define('User', userSchema);
      return neo4js.sync()
        .then(() => {
          return neo4js.getSchemaInfo();
        })
        .then(schemaInfo => {
          expect(schemaInfo).to.eql({ User: { guid: { index: true }, name: { index: true, unique: true } } });
        });
    })
  })

  describe('sync', () => {

  });
});

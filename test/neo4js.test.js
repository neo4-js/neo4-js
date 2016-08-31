var chai = require('chai');
var expect = chai.expect;

import serverHelper from './server-helper';

import Neo4js from '../src/neo4js';
const Model = Neo4js.Model;

const neo4js = serverHelper.getNeo4jsInstance();

const model1Schema = {
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
      const User = neo4js.define('Model1', model1Schema);

      expect(User).to.be.instanceof(Model);
      expect(User).to.have.property('name');
      expect(User).to.have.property('labels');
      expect(User.labels).to.be.instanceof(Array);
      expect(typeof User.create).to.equal('function');
    });
  });

  describe('getSchemaInfo', () => {
    it('should return the schema synced', () => {
      const User = neo4js.define('Model1', model1Schema);
      return User.sync()
        .then(() => neo4js.getSchemaInfo())
        .then(schemaInfo => {
          expect(schemaInfo.Model1).to.eql({ guid: { index: true }, name: { index: true, unique: true } });
        });
    });
  });
});

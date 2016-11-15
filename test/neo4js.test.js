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
      const User = neo4js.define('Model1', userSchema);

      expect(User).to.be.instanceof(Model);
      expect(User).to.have.property('name');
      expect(User).to.have.property('labels');
      expect(User.schema).to.be.ok;
      expect(User.labels).to.be.instanceof(Array);
      expect(typeof User.create).to.equal('function');
    });
  });

  describe('getSchemaInfo', () => {
    it('should return the schema synced', () => {
      const User = neo4js.define('Model1', userSchema);
      return User.sync()
        .then(() => neo4js.getSchemaInfo())
        .then(schemaInfo => {
          expect(schemaInfo.Model1).to.eql({ guid: { index: true }, name: { index: true, unique: true } });
        });
    });
  });

  describe('getModel', () => {
    it('should return the model instance', () => {
      const Player = neo4js.define(['getModel1', 'getModel2'], {
        id: {
          index: true,
          defaultValue: Neo4js.uuid4
        },
        name: { },
        email: {
          unique: true
        },
        password: {
          exists: true
        }
      });
      const getPlayer = neo4js.getModel('getModel2');
      expect(Player).to.eql(getPlayer);
    })
  })
});

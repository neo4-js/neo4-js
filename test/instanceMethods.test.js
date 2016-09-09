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
  firstname: { },
  lastname: { },
  instanceMethods: {
    getFullName: () => {
      return [this.firstname, this.lastname].join(' ');
    },
    compareLastname: function(lastname) {
      return this.lastname === lastname;
    },
  }
};

describe('ModelObject', () => {
  describe('instance methods', () => {
    it ('should have instance methods', () => {
      const User = neo4js.define('InstanceModel1', userSchema);
      return User.sync()
        .then(() => User.create({ firstname: 'John', lastname: 'Snow' }))
        .then(newUser => {
          expect(newUser.getFullName).to.be.ok;
          expect(newUser.getFullName()).to.equal('John Snow');
          expect(newUser.compareLastname('Snow')).to.be.true;
          expect(newUser.compareLastname('Hans')).to.be.false;
        });
    });
  });
});

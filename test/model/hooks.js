var chai = require('chai');
var expect = chai.expect;

import { BaseError } from '../../src/errors';

import Hooks from '../../src/hooks';
import serverHelper from '../server-helper';

import Neo4js from '../../src/neo4js';
const Model = Neo4js.Model;

const neo4js = serverHelper.getNeo4jsInstance();

const userSchema = {
  guid: {
    index: true,
    defaultValue: neo4js.uuid4,
  },
  firstname: { },
  lastname: { },
  password: { },
  instanceMethods: {
    getFullName: function() {
      return [this.firstname, this.lastname].join(' ');
    },
    compareLastname: function(lastname) {
      return this.lastname === lastname;
    },
  }
};

const userHooks = {
  beforeCreate: function (instance) {
    instance.firstname = instance.firstname.toUpperCase();
    this.lastname = this.lastname.toUpperCase();
  },
  afterCreate: function (instance) {
    delete this.password;
    return this;
  },
  beforeFind: function (instance) {
    instance.firstname = instance.firstname.toUpperCase();
    return this;
  },
  afterFind: function(instance) {
    delete instance.password;
  }
};

describe('hooks', () => {
  it('should return an error message with undefined hook types', () => {
    const hooks = new Hooks();
    const hooksDefinitions = {
      'test1': () => {},
      'test2': () => {},
      'beforeCreate': () => {}
    }

    try {
      const wrongHooks = hooks.init(hooksDefinitions);

      // This should not be reached
      expect(true).to.equal(false);
    } catch (error) {
      if (error.name === 'Neo4jsBaseError') {
        expect(error).to.be.an('error');
        expect(error.message).to.equal('Hooks not available yet: test1, test2');
      } else {
        throw error;
      }
    }
  });

  it('should apply create hooks', () => {
    const User = neo4js.define('hooksTest1', userSchema, userHooks);
    return User.create({ firstname: 'hans', lastname: 'Huber', password: '1234' })
      .then((createdUser) => {
        expect(createdUser.p.firstname).to.equal('HANS');
        expect(createdUser.p.lastname).to.equal('HUBER');
        expect(createdUser.p.password).to.equal(undefined);
      });
  });

  it('should apply find hooks', () => {
    const User = neo4js.define('hooksTest2', userSchema, userHooks);
    return User.create({ firstname: 'hans', lastname: 'Huber', password: '1234'})
      .then((createdUser) => {
        return User.find({ firstname: 'hans' })
          .then((foundUsers) => {
            expect(foundUsers.length).to.equal(1);
            expect(foundUsers[0].p.firstname).to.equal('HANS');
            expect(foundUsers[0].p.lastname).to.equal('HUBER');
            expect(foundUsers[0].p.password).to.equal(undefined); 
          });
      });
  });

  it('should apply find hooks on findOne', () => {
    const User = neo4js.define('hooksTest2', userSchema, userHooks);
    return User.create({ firstname: 'hans', lastname: 'Huber', password: '1234'})
      .then((createdUser) => {
        return User.findOne({ firstname: 'hans' })
          .then((foundUser) => {
            expect(foundUser.p.firstname).to.equal('HANS');
            expect(foundUser.p.lastname).to.equal('HUBER');
            expect(foundUser.p.password).to.equal(undefined); 
          });
      });
  });
});
var chai = require('chai');
var expect = chai.expect;

import serverHelper from '../server-helper';

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
        expect(object.text).to.equal('asdf');
      })
      .catch(err => {
        expect(err).to.be.null;
      });
  });

  it('should return an error when breaking the unique constraint', function() {
    return DbModel.create({ text: 'foo' })
      .then(object => {
        return DbModel.create(object.p)
      })
      .catch(err => {
        expect(err).to.be.instanceof(Error);
      });
  });

  it('should return a promise', function() {
    expect(DbModel.create({ text: 'bar' })).to.be.instanceof(Promise);
  });

  it('should create a new relation between 2 new nodes', function() {
    const Person = neo4js.define('Create2', {
      name: {
        unique: true
      },
      relations: {
        'knows': {
          direction: 'any',
          labels: 'knows',
          to: Person,
          properties: {
            since: {
              exists: true,
            },
          },
        },
      },
    });

    let john;
    return Person.create({ name: 'John' })
      .then((result) => {
        john = result;
        return Person.create({ name: 'Clara' });
      })
      .then((clara) => {
        return john
          .relate('knows', { since: 2000 })
          .to(clara)
          .then(result => {
            expect(result).to.be.true;
          })
          .catch(err => {
            expect(err).to.be.false;
            expect(err).to.not.be.instanceof(Error);
          });
      });
  });
});

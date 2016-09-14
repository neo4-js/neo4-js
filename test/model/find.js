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

  it('should return all found objects with all of their relations', function() {
    const Person = neo4js.define('Find2', {
      guid: {
        index: true,
        defaultValue: Neo4js.uuid4,
      },
      name: {
        unique: true,
      },
    });

    Person.hasMany(Person, 'friends');

    let john;
    return Person.create({ name: 'John' })
      .then((result) => {
        john = result;
        return Person.create({ name: 'Clara' });
      })
      .then((clara) => {
        return john
          .relate('friend', { since: 2000 })
          .to(clara)
          .catch(err => {
            expect(err).to.be.false;
            expect(err).to.not.be.instanceof(Error);
          })
          .then(result => {
            expect(result).to.be.true;
            return Person.find();
          })
          .then(persons => {
            expect(persons).to.be.instanceof(Array);
            persons.forEach(person => {
              expect(person.p.friends).to.be.instanceof(Array);
              expect(person.p.friends.length).to.equal(1);
              expect(person.p.friends[0]).to.be.instanceof(Neo4js.ModelObject);
              if (person.p.name === 'John') {
                expect(person.p.friends[0].name).to.equal('Clara');
              } else {
                expect(person.p.friends[0].name).to.equal('John');
              }
            })
          });
      });
  });
});

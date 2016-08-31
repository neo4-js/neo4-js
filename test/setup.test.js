var chai = require('chai');
var expect = chai.expect;

import serverHelper from './server-helper';

import Neo4js from '../src/neo4js';

const neo4js = serverHelper.getNeo4jsInstance();

before(() => {
  return neo4js.sync({ force: true });
});

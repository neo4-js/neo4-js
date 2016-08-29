import { v1 as neo4j } from 'neo4j-driver';
import Utils from './Utils';
import uuid from 'node-uuid';

import neo4jsErrors from './errors';
import Model from './model';
import ModelManager from './model-manager';
import { getSchemaInfo } from './schema-info';

class Neo4js {
  /**
   *
   * @param {String}  username The username which is used to authenticate against the database
   * @param {String}  password The password which is used to authenticate against the database
   * @param {Object}  [options={}] An object with options
   * @param {String}  [options.url=localhost] Bolt url
   * @param {Integer} [options.port=7687] Bolt port
   * @param {Object}  [options.rest={}]
   * @param {String}  [options.rest.url=localhost]
   * @param {Integer} [options.rest.port=7474]
   * @param {Integer} [options.connectionPoolSize=50]
   */
  constructor(username, password, options) {
    this.auth = { username, password };

    const defaultOptions = {
      url: `bolt://localhost`,
      port: 7687,
      rest: {
        url: `http://localhost`,
        port: 7474,
      },
      driver: {
        connectionPoolSize: 50,
      },
    };

    options = Utils._.extend({}, defaultOptions, options || {});
    options.rest = Utils._.extend({}, defaultOptions.rest, options.rest);
    options.driver = Utils._.extend({}, defaultOptions.driver, options.driver);

    // TODO: Maybe add here some more checks...
    const url = `${options.url}:${options.port}`;
    this.driver = neo4j.driver(url, neo4j.auth.basic(username, password), options.driver);

    this.options = options;

    this.models = {};
    this.modelManager = new ModelManager(this);
  }

  define(label, schema) {
    const model = new Model(label, schema, this);
    this.modelManager.add(model);
    return model;
  }

  getSchemaInfo() {
    return getSchemaInfo(this.options.rest.url, this.options.rest.port, this.auth);
  }

  sync(options) {

  }

  run(cmd, params) {
    const session = this.driver.session();
    return session.run(cmd, params)
      .then(result => {
        session.close();
        return result;
      })
      .catch(err => {
        session.close();
        return err;
      });
  }

  static uuid4() {
    return uuid.v4();
  }

  static uuid1() {
    return uuid.v1();
  }
}

Neo4js.prototype.Error = Neo4js.Error = neo4jsErrors.BaseError;

export default Neo4js;

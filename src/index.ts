import { v1 as neo4j } from "neo4j-driver";
import { Model } from "./Model";
import { ModelInstance } from "./ModelInstance";
import * as debug from "debug";
import { Neo4jResultStats } from "./Types";

export type Neo4jsOptions = {
  boltUri?: string;
  boltPort?: number;
  restUri?: string;
  restPort?: number;
  username?: string;
  password?: string;
};

export * from "./Types";

const d = debug("neo4js:debug");

class neo4js {
  options: Neo4jsOptions;
  driver: any;

  init(options: Neo4jsOptions) {
    this.options = { ...options };

    // TODO: at least some verification...
    const uri = `bolt://${this.options.boltUri}:${this.options.boltPort}`;
    const { username, password } = this.options;
    let auth = undefined;
    if (username) {
      auth = neo4j.auth.basic(username, password);
    }

    d("Init neo4js: %O", { ...this.options, uri, username, password });
    if (this.driver) this.close();
    this.driver = neo4j.driver(uri, auth);
  }

  close = () => {
    d("Closing neo4js connection");
    this.driver.close();
  };

  run = (
    cmd: string,
    params?: any
  ): Promise<any[] & { _stats: Neo4jResultStats; _raw: any }> => {
    let session = this.driver.session();
    d("Cypher query: %s", cmd);
    d("Params: %O", params);
    return session
      .run(cmd, params)
      .then(raw => {
        d("Raw result: %O", raw);
        session.close();
        let result = raw.records.map(r => r.toObject()).map(r => {
          let keys = Object.keys(r);
          let o = {};
          keys.forEach(k => (o[k] = r[k].properties));
          return o;
        });
        result._stats = raw.summary.counters._stats;
        result._raw = raw;
        d("Prepared result: %O", result);
        return result;
      })
      .catch(err => {
        session.close();
        throw err;
      });
  };
}

export default new neo4js();

export * from "./Model";
export * from "./ModelInstance";
export * from "./Relation";
export * from "./Decorators";

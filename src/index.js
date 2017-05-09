// @flow

import { v1 as neo4j } from "neo4j-driver";
import { autobind } from "core-decorators";
import idx from "idx";

export type Neo4jsOptions = {
  boltUri?: string,
  boltPort?: number,
  restUri?: string,
  restPort?: number,
  username?: string,
  password?: string,
};

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

    if (this.driver) this.close();
    this.driver = neo4j.driver(uri);
  }

  @autobind()
  close() {
    this.driver.close();
  }

  @autobind()
  run(
    cmd: string,
    params?: any
  ): Promise<any[] & { _stats: Neo4jResultStats, _raw: any }> {
    let session = this.driver.session();
    return session
      .run(cmd, params)
      .then(raw => {
        session.close();
        let result = raw.records.map(r => r.toObject()).map(r => {
          let keys = Object.keys(r);
          let o = {};
          keys.forEach(k => (o[k] = r[k].properties));
          return o;
        });
        result._stats = idx(raw, r => r.summary.counters._stats);
        result._raw = raw;
        return result;
      })
      .catch(err => {
        session.close();
        throw err;
      });
  }
}

export default new neo4js();

export * from "./Model";
export * from "./ModelInstance";
export * from "./Relation";

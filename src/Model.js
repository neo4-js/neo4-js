// @flow

import { forIn } from "lodash";
import uuid from "uuid";
import { autobind } from "core-decorators";
import trineo, { ModelInstance, Relation } from "./index";
import type { BaseProps, RelationType } from "./index";
import {
  CharGenerator,
  prepareWhere,
  prepareSet,
  relationConnectHelper,
} from "./utils";

export class Model<P, I: ModelInstance<P>> {
  label: string;
  relations: Relation[];
  modelInstanceClass: Class<ModelInstance<*>>;

  beforeCreate(props: P): P {
    return props;
  }
  afterCreate(instance: I): I {
    return instance;
  }

  beforeFind(props?: P & BaseProps): ?(P & BaseProps) {
    return props;
  }
  afterFind(instance: I): I {
    return instance;
  }

  beforeUpdate(
    props: P & BaseProps,
    newProps: P
  ): { props: P & BaseProps, newProps: P } {
    return { props, newProps };
  }
  afterUpdate(instance: I): I {
    return instance;
  }

  _createModelInstance(props: P & BaseProps): I {
    let instance = this.modelInstanceClass
      ? new this.modelInstanceClass(props)
      : new ModelInstance(props);
    this.relations.forEach(
      r => (instance = r.addFunctionsToInstance(instance))
    );
    return ((instance: any): I);
  }

  constructor(label: string) {
    this.label = label;
    this.relations = [];
    relationConnectHelper.models[label] = this;

    relationConnectHelper.relationsToAdd
      .filter(t => t.destLabel == label)
      .forEach(t => {
        t.src.addRelation(
          this,
          t.propertyName,
          t.relationLabel,
          t.relationType
        );
      });
    relationConnectHelper.relationsToAdd = relationConnectHelper.relationsToAdd.filter(
      t => t.destLabel != label
    );
  }

  async create(props: P): Promise<I> {
    let p = this.beforeCreate(props);
    p = ({ ...(p: any) }: P & BaseProps);
    p.guid = uuid();

    const result = await trineo.run(
      `
        CREATE (n:${this.label} {p})
        RETURN n
      `,
      { p }
    );
    if (!result || result.length !== 1) {
      throw new Error(
        `Create didn't work, cmd: "CREATE (n:${this.label} {p}) RETURN n" with params: ${JSON.stringify(
          { p }
        )}`
      );
    }

    return this.afterCreate(this._createModelInstance(result[0].n));
  }

  async findByGuid(guid: string): Promise<I | null> {
    const result = await trineo.run(
      `
        MATCH (n:${this.label} {guid:{guid}})
        RETURN n
      `,
      { guid }
    );

    if (!result || result.length > 1) {
      throw new Error(
        `Match didn't work, cmd: "MATCH (n:${this.label} {guid:{guid}}) RETURN n" with params: ${JSON.stringify(
          { guid }
        )}`
      );
    }

    if (result.length === 0) {
      return null;
    }

    return this._createModelInstance(result[0].n);
  }

  async delete(props: P & BaseProps, detach: boolean = false): Promise<number> {
    const { where, flatProps } = prepareWhere(props, "n");

    const result = await trineo.run(
      `
        MATCH (n:${this.label})
        ${where}
        ${detach ? " DETACH " : ""} DELETE n
      `,
      flatProps
    );

    // $FlowFixMe
    return result._stats.nodesDeleted;
  }

  async find(props?: P & BaseProps): Promise<I[]> {
    const p = this.beforeFind(props);
    const { where, flatProps } = prepareWhere(p, "n");

    let result = await trineo.run(
      `
        MATCH (n:${this.label})
        ${where}
        RETURN n
      `,
      flatProps
    );

    result = result.map(p => this.afterFind(this._createModelInstance(p.n)));
    return result;
  }

  async findOne(props?: P & BaseProps): Promise<?I> {
    const p = this.beforeFind(props);
    const { where, flatProps } = prepareWhere(p, "n");

    let result = await trineo.run(
      `
        MATCH (n:${this.label})
        ${where}
        RETURN n
      `,
      flatProps
    );

    if (result.length) {
      return this.afterFind(this._createModelInstance(result[0].n));
    }
    return Promise.resolve(null);
  }

  async update(props: P & BaseProps, newProps: P): Promise<I[]> {
    const params = this.beforeUpdate(props, newProps);
    const { where, flatProps } = prepareWhere(params.props, "n");
    const { str: setPropsStr, newProps: _newProps } = prepareSet(
      "n",
      params.newProps
    );

    let result = await trineo.run(
      `
        MATCH (n:${this.label})
        ${where}
        SET ${setPropsStr}
        RETURN n
      `,
      { ...flatProps, ..._newProps }
    );

    result = result.map(p => this.afterUpdate(this._createModelInstance(p.n)));
    return result;
  }

  addRelation(
    model: Model<*, *>,
    propertyName: string,
    relationLabel: string,
    relationType: RelationType
  ) {
    this.relations.push(
      new Relation(relationType, this, model, propertyName, relationLabel)
    );
  }
}

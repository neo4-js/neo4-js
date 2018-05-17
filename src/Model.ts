// @flow

import { forIn, mapValues } from "lodash";
import * as uuid from "uuid";
import neo4js, {
  ModelInstance,
  Relation,
  BaseProps,
  RelationType,
} from "./index";
import { CharGenerator, prepareWhere, prepareSet } from "./utils";

export class Model<P, M extends ModelInstance<P>> {
  public label: String;
  relations: Relation[];
  modelInstanceClass: new (props: P) => M;

  protected beforeCreate(props: P): P {
    return props;
  }
  protected afterCreate(instance: M): M {
    return instance;
  }

  protected beforeFind(props?: P & BaseProps): (P & BaseProps) | null {
    return props;
  }
  protected afterFind(instance: M): M {
    return instance;
  }

  protected beforeUpdate(
    props: P & BaseProps,
    newProps: P
  ): { props: P & BaseProps; newProps: P } {
    return { props, newProps };
  }
  protected afterUpdate(instance: M): M {
    return instance;
  }

  protected _createModelInstance(props: P & BaseProps): M {
    let instance: any = this.modelInstanceClass
      ? new this.modelInstanceClass(props)
      : new ModelInstance(props);
    this.relations.forEach(
      r => (instance = r.addFunctionsToInstance(instance))
    );
    return instance;
  }

  constructor(label: string) {
    this.label = label;
    this.relations = [];
  }

  public async create(props: P): Promise<M> {
    let defaultProps = mapValues(
      this.modelInstanceClass
        ? this.modelInstanceClass.prototype._defaultProps
        : {},
      prop => (typeof prop === "function" ? prop() : prop)
    );
    let p: P & BaseProps = this.beforeCreate({
      guid: uuid.v4(),
      ...defaultProps,
      ...(props as any),
    } as P);
    p = { ...(p as any) } as P & BaseProps;

    const result = await neo4js.run(
      `
        CREATE (n:${this.label} {p})
        RETURN n
      `,
      { p }
    );
    if (!result || result.length !== 1) {
      throw new Error(
        `Create didn't work, cmd: "CREATE (n:${
          this.label
        } {p}) RETURN n" with params: ${JSON.stringify({ p })}`
      );
    }

    return this.afterCreate(this._createModelInstance(result[0].n));
  }

  public async findByGuid(guid: string): Promise<M | null> {
    const result = await neo4js.run(
      `
        MATCH (n:${this.label} {guid:{guid}})
        RETURN n
      `,
      { guid }
    );

    if (!result || result.length > 1) {
      throw new Error(
        `Match didn't work, cmd: "MATCH (n:${
          this.label
        } {guid:{guid}}) RETURN n" with params: ${JSON.stringify({
          guid,
        })}`
      );
    }

    if (result.length === 0) {
      return null;
    }

    return this._createModelInstance(result[0].n);
  }

  public async delete(
    props: P & BaseProps,
    detach: boolean = false
  ): Promise<number> {
    const { where, flatProps } = prepareWhere(props, "n");

    const result = await neo4js.run(
      `
        MATCH (n:${this.label})
        ${where}
        ${detach ? " DETACH " : ""} DELETE n
      `,
      flatProps
    );

    return result._stats.nodesDeleted;
  }

  public async find(props?: P & BaseProps): Promise<M[]> {
    const p = this.beforeFind(props);
    const { where, flatProps } = prepareWhere(p, "n");

    let result = await neo4js.run(
      `
        MATCH (n:${this.label})
        ${where}
        RETURN n
      `,
      flatProps
    );

    return result.map(p => this.afterFind(this._createModelInstance(p.n)));
  }

  public async findOne(props?: P & BaseProps): Promise<M | null> {
    const p = this.beforeFind(props);
    const { where, flatProps } = prepareWhere(p, "n");

    let result = await neo4js.run(
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

  public async update(props: P & BaseProps, newProps: P): Promise<M[]> {
    const params = this.beforeUpdate(props, newProps);
    const { where, flatProps } = prepareWhere(params.props, "n");
    const { str: setPropsStr, newProps: _newProps } = prepareSet(
      params.newProps,
      "n"
    );

    let result = await neo4js.run(
      `
        MATCH (n:${this.label})
        ${where}
        SET ${setPropsStr}
        RETURN n
      `,
      { ...flatProps, ..._newProps }
    );

    return result.map(p => this.afterUpdate(this._createModelInstance(p.n)));
  }
}

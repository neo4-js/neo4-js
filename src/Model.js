// @flow

import { forIn } from 'lodash';
import uuid from 'uuid';
import trineo, { ModelInstance, Relation, } from './index';
import type { BaseProps, RelationType, } from './index';

export class Model<P, I: ModelInstance<P>> {
  label: string;
  relations: Relation[];

  beforeCreate(props: P): P { return props; }
  afterCreate(instance: I): I { return instance; }

  beforeFind(props?: P & BaseProps): ?(P & BaseProps) { return props; }
  afterFind(instance: I): I { return instance; }

  beforeUpdate(props: P & BaseProps, newProps: P): { props: P & BaseProps, newProps: P } { return { props, newProps }; }
  afterUpdate(instance: I): I { return instance; }

  prepareMatchProps(props: P & BaseProps): string {
    const matches = [];

    forIn(props, (v, k) => {
      matches.push(`${k}:{${k}}`);
    });

    return matches.join(',');
  }

  prepareSetProps(variable: string, props: P): { str: string, newProps: any } {
    const sets = [];
    const newProps: any = {};

    forIn(props, (v, k) => {
      if (k === 'guid') return null;
      sets.push(`${variable}.${k}={_u${k}}`);
      newProps[`_u${k}`] = v;
    });

    if (!sets.length) throw new Error(`Nothing to update`);


    return { str: sets.join(' '), newProps };
  }

  _createModelInstance(props: P & BaseProps): I {
    let instance = new ModelInstance(props);
    this.relations.forEach(r => (instance = r.addFunctionsToInstance(instance)));
    return ((instance: any): I);
  }

  constructor(label: string) {
    this.label = label;
    this.relations = [];
  }

  async create(props: P): Promise<I> {
    let p = this.beforeCreate(props);
    p = ({ ...(p: any) }: P & BaseProps);
    p.guid = uuid();

    const result = await trineo.run(`
        CREATE (n:${this.label} {p})
        RETURN n
      `, { p });
    if (!result || result.length !== 1) {
      throw new Error(`Create didn't work, cmd: "CREATE (n:${this.label} {p}) RETURN n" with params: ${JSON.stringify({p})}`);
    }

    return this.afterCreate(this._createModelInstance(result[0].n));
  }

  async findByGuid(guid: string): Promise<I | null> {
    const result = await trineo.run(`
        MATCH (n:${this.label} {guid:{guid}})
        RETURN n
      `, { guid });

    if (!result || result.length > 1) {
      throw new Error(`Match didn't work, cmd: "MATCH (n:${this.label} {guid:{guid}}) RETURN n" with params: ${JSON.stringify({guid})}`);
    }

    if (result.length === 0) {
      return null;
    }

    return this._createModelInstance(result[0].n);
  }

  async delete(props: P & BaseProps, detach: boolean = false): Promise<number> {
    const matchPropsStr = this.prepareMatchProps(props);

    const result = await trineo.run(`
        MATCH (n:${this.label} {${matchPropsStr}})
        ${detach ? ' DETACH ' : ''} DELETE n
      `, props);

    // $FlowFixMe
    return result._stats.nodesDeleted;
  }

  async find(props?: P & BaseProps): Promise<I[]> {
    const p = this.beforeFind(props);
    const matchPropsStr = p ? this.prepareMatchProps(p) : '';

    let result = await trineo.run(`
        MATCH (n:${this.label} {${matchPropsStr}})
        RETURN n
      `, p);

    result = result
      .map(p => this.afterFind(this._createModelInstance(p.n)));
    return result;
  }

  async update(props: P & BaseProps, newProps: P): Promise<I[]> {
    const params = this.beforeUpdate(props, newProps);
    const matchPropsStr = this.prepareMatchProps(params.props);
    const { str: setPropsStr, newProps: _newProps } = this.prepareSetProps('n', params.newProps);

    let result = await trineo.run(`
        MATCH (n:${this.label} {${matchPropsStr}})
        SET ${setPropsStr}
        RETURN n
      `, { ...(params.props: any), ..._newProps });
    
    result = result.map(p => this.afterUpdate(this._createModelInstance(p.n)));
    return result;
  }

  hasMany(model: Model<*, *>, propertyName: string) {
    this.relations.push(new Relation('hasMany', this, model, propertyName));
  }

  hasOne(model: Model<*, *>, propertyName: string, defaultLabel?: string) {
    this.relations.push(new Relation('hasOne', this, model, propertyName, defaultLabel));
  }
}

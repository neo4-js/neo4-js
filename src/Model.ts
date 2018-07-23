import { forIn, mapValues, uniqWith } from "lodash";
import * as uuid from "uuid";
import neo4js, {
  ModelInstance,
  Relation,
  BaseProps,
  RelationType,
  Optional,
  PropertiesType,
} from "./index";
import { CharGenerator, prepareWhere, prepareSet } from "./utils";

export function createModelInstance<P, M extends ModelInstance<P>>(
  model: Model<P, M>,
  props: P & BaseProps | null
): M {
  let instance: any;

  // @ts-ignore
  if (model.modelInstanceClass) {
    // @ts-ignore
    instance = new model.modelInstanceClass(props);
  } else {
    instance = new ModelInstance(props);
  }
  // @ts-ignore
  model.relations.forEach(r => (instance = r.addFunctionsToInstance(instance)));
  return instance;
}

export function createFakeModelInstance<P, M extends ModelInstance<P>>(
  model: Model<P, M>,
  charGenerator: CharGenerator
): M {
  let instance: any;

  // @ts-ignore
  if (model.modelInstanceClass) {
    // @ts-ignore
    instance = new model.modelInstanceClass({});
  } else {
    instance = new ModelInstance({ guid: null });
  }
  // @ts-ignore
  model.relations.forEach(
    r => (instance = r.addFunctionsToInstance(instance, charGenerator))
  );
  return instance;
}

const compareByGuid = (chainItem: ChainItem) => (a, b) =>
  a[chainItem.variable].guid === b[chainItem.variable].guid;

function addChildValues(parents: any[], all: any[], node: ChainItem) {
  if (!node) return parents;

  return parents.map(parent => {
    const children = addChildValues(
      uniqWith(
        all.filter(i => i[node.prev.variable].guid === parent.props.guid),
        compareByGuid(node)
      ).map(i => {
        if (i[node.variable]) {
          // @ts-ignore
          const instance = node.model.afterFind(
            createModelInstance(node.model, i[node.variable])
          );
          if (
            i[node.relationVariable] &&
            Object.keys(i[node.relationVariable]).length > 0
          ) {
            instance.relationProps = i[node.relationVariable];
          }
          return instance;
        }
        return null;
      }),
      all,
      node.next
    );

    parent[node.propertyName] = node.hasOne
      ? children.length > 0
        ? children[0]
        : null
      : children;

    return parent;
  });
}

export type ChainItem = {
  model: Model<any, any>;
  fakeInstance: ModelInstance<any>;
  match: string;
  flatProps: any;
  result: string[];
  where: string[];
  variable: string;
  relationVariable?: string;
  next?: ChainItem;
  prev?: ChainItem;
  first?: ChainItem;
  hasOne?: boolean;
  propertyName?: string;
  firstOne?: boolean;
};

export class IncludesQuery<M extends ModelInstance<any>> {
  chainItem: ChainItem;
  charGenerator: CharGenerator;

  constructor(chainItem: ChainItem, charGenerator: CharGenerator) {
    this.chainItem = chainItem;
    this.charGenerator = charGenerator;
  }

  include<P, R extends ModelInstance<P>>(fn: (m: M) => Promise<R[] | R>) {
    const { chainItem } = this;
    // @ts-ignore
    chainItem.next = fn(chainItem.fakeInstance);
    chainItem.next.prev = chainItem;
    chainItem.next.first = chainItem.first;
    return new IncludesQuery<R>(chainItem.next, this.charGenerator);
  }

  run(): Promise<any> {
    let match = "MATCH ";
    let result = [];
    let params = {};

    let chainItem = this.chainItem.first;

    while (chainItem) {
      if (chainItem.first === chainItem) {
        match += chainItem.match;
      } else {
        match += ` OPTIONAL MATCH (${chainItem.prev.variable})${
          chainItem.match
        }`;
      }
      result = [...result, ...chainItem.result];
      params = { ...params, ...chainItem.flatProps };
      chainItem = chainItem.next;
    }
    chainItem = this.chainItem.first;

    const query = match + " RETURN " + result.join(", ");

    return neo4js.run(query, params).then(result => {
      // @ts-ignore
      const instances = addChildValues(
        uniqWith(result, compareByGuid(chainItem)).map(i =>
          createModelInstance(chainItem.model, i[chainItem.variable])
        ),
        result,
        chainItem.next
      );

      return chainItem.first.firstOne
        ? instances.length > 0
          ? instances[0]
          : null
        : instances;
    });
  }
}

export class Model<P, M extends ModelInstance<P>> {
  public label: String;
  private relations: Relation[];
  private modelInstanceClass: new (props: P) => M;

  protected beforeCreate(props: P & BaseProps): P & BaseProps {
    return props;
  }
  protected afterCreate(instance: M): M {
    return instance;
  }

  protected beforeFind(
    props?: Optional<PropertiesType<P & BaseProps>>
  ): (Optional<PropertiesType<P & BaseProps>>) | null {
    return props;
  }
  protected afterFind(instance: M): M {
    return instance;
  }

  protected beforeUpdate(
    props: Optional<PropertiesType<P & BaseProps>>,
    newProps: Optional<P>
  ): { props: Optional<PropertiesType<P & BaseProps>>; newProps: Optional<P> } {
    return { props, newProps };
  }
  protected afterUpdate(instance: M): M {
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
    });
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

    return this.afterCreate(createModelInstance(this, result[0].n));
  }

  public findByGuidAndInclude(guid: string): IncludesQuery<M> {
    const charGenerator = new CharGenerator();
    const variable = charGenerator.next();
    const { where, flatProps } = prepareWhere(
      { guid },
      variable,
      charGenerator
    );
    // @ts-ignore
    const chainItem: ChainItem = {
      model: this,
      fakeInstance: createFakeModelInstance(this, charGenerator),
      match: `(${variable}:${this.label}) ${where}`,
      flatProps,
      result: [variable],
      variable,
      firstOne: true,
    };

    chainItem.first = chainItem;

    return new IncludesQuery(chainItem, charGenerator);
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

    return createModelInstance(this, result[0].n);
  }

  public async delete(
    props: Optional<PropertiesType<P & BaseProps>>,
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

  public findAndInclude(
    props?: Optional<PropertiesType<P & BaseProps>>
  ): IncludesQuery<M> {
    const charGenerator = new CharGenerator();
    const variable = charGenerator.next();
    const { where, flatProps } = prepareWhere(
      this.beforeFind(props),
      variable,
      charGenerator
    );
    // @ts-ignore
    const chainItem: ChainItem = {
      model: this,
      fakeInstance: createFakeModelInstance(this, charGenerator),
      match: `(${variable}:${this.label}) ${where}`,
      flatProps,
      result: [variable],
      variable,
    };

    chainItem.first = chainItem;

    return new IncludesQuery(chainItem, charGenerator);
  }

  public async find(
    props?: Optional<PropertiesType<P & BaseProps>>
  ): Promise<M[]> {
    const p = this.beforeFind(props);
    const { where, flatProps } = prepareWhere(p, "n");

    const result = await neo4js.run(
      `
        MATCH (n:${this.label})
        ${where}
        RETURN n
      `,
      flatProps
    );

    return result.map(p => this.afterFind(createModelInstance(this, p.n)));
  }

  public findOneAndInclude(
    props?: Optional<PropertiesType<P & BaseProps>>
  ): IncludesQuery<M> {
    const charGenerator = new CharGenerator();
    const variable = charGenerator.next();
    const { where, flatProps } = prepareWhere(
      this.beforeFind(props),
      variable,
      charGenerator
    );
    // @ts-ignore
    const chainItem: ChainItem = {
      model: this,
      fakeInstance: createFakeModelInstance(this, charGenerator),
      match: `(${variable}:${this.label}) ${where}`,
      flatProps,
      result: [variable],
      variable,
      firstOne: true,
    };

    chainItem.first = chainItem;

    return new IncludesQuery(chainItem, charGenerator);
  }

  public async findOne(
    props?: Optional<PropertiesType<P & BaseProps>>
  ): Promise<M | null> {
    const p = this.beforeFind(props);
    const { where, flatProps } = prepareWhere(p, "n");

    const result = await neo4js.run(
      `
        MATCH (n:${this.label})
        ${where}
        RETURN n
      `,
      flatProps
    );

    if (result.length) {
      return this.afterFind(createModelInstance(this, result[0].n));
    }
    return Promise.resolve(null);
  }

  public async update(
    props: Optional<PropertiesType<P & BaseProps>>,
    newProps: Optional<P>
  ): Promise<M[]> {
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

    return result.map(p => this.afterUpdate(createModelInstance(this, p.n)));
  }
}

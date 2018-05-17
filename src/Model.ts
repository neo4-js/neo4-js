import { forIn, mapValues } from "lodash";
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
  props: P & BaseProps
): M {
  // @ts-ignore
  let instance: any = model.modelInstanceClass
    ? // @ts-ignore
      new model.modelInstanceClass(props)
    : new ModelInstance(props);
  // @ts-ignore
  model.relations.forEach(r => (instance = r.addFunctionsToInstance(instance)));
  return instance;
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

  public async find(
    props?: Optional<PropertiesType<P & BaseProps>>
  ): Promise<M[]> {
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

    return result.map(p => this.afterFind(createModelInstance(this, p.n)));
  }

  public async findOne(
    props?: Optional<PropertiesType<P & BaseProps>>
  ): Promise<M | null> {
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

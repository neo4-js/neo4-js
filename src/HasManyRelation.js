// @flow
import trineo, { ModelInstance } from "./index";
import { prepareWhere } from "./utils";

export async function get(
  instance: ModelInstance<*>,
  label: ?string,
  props: any
): Promise<any> {
  if (!label) {
    return Promise.reject(new Error("No relation label given"));
  }

  const { where, flatProps } = prepareWhere(props, "b");

  const result = await trineo.run(
    `
    MATCH (a:${this.src.label} {guid:{_srcGuid}})-[c:${label}]-(b:${this.dest.label})
    ${where}
    RETURN b
  `,
    { _srcGuid: instance.props.guid, ...flatProps }
  );

  return Promise.resolve(result.map(p => this.dest._createModelInstance(p.b)));
}

export async function create(
  instance: ModelInstance<*>,
  label: ?string,
  propsArray: any[]
): Promise<any> {
  if (!label) {
    return Promise.reject(new Error("No relation label given"));
  }

  const destInstances = [];

  for (const props of propsArray) {
    const destInstance = await this.dest.create(props);
    destInstances.push(destInstance);
    await trineo.run(
      `
      MATCH
        (a:${this.src.label} {guid:{srcGuid}}),
        (b:${this.dest.label} {guid:{destGuid}})
      MERGE (a)-[c:${label}]->(b)
    `,
      { srcGuid: instance.props.guid, destGuid: destInstance.props.guid }
    );
  }

  return Promise.resolve(destInstances);
}

export async function add(
  instance: ModelInstance<*>,
  label: ?string,
  instances: ModelInstance<*>[]
): Promise<number> {
  if (!label) {
    return Promise.reject(new Error("No relation label given"));
  }

  let relationshipsCreated = 0;
  for (const destInstance of instances) {
    const result = await trineo.run(
      `
      MATCH
        (a:${this.src.label} {guid:{srcGuid}}),
        (b:${this.dest.label} {guid:{destGuid}})
      MERGE (a)-[c:${label}]->(b)
    `,
      { srcGuid: instance.props.guid, destGuid: destInstance.props.guid }
    );

    relationshipsCreated += result._stats.relationshipsCreated;
  }

  return Promise.resolve(relationshipsCreated);
}

export async function count(
  instance: ModelInstance<*>,
  label: ?string,
  props: any
): Promise<number> {
  if (!label) {
    return Promise.reject(new Error("No relation label given"));
  }

  const { where, flatProps } = prepareWhere(props, "b");

  const result = await trineo.run(
    `
    MATCH (a:${this.src.label} {guid:{_srcGuid}})-[c:${label}]->(b:${this.dest.label})
    ${where}
    RETURN COUNT(b) as b
  `,
    { _srcGuid: instance.props.guid, ...flatProps }
  );

  // $FlowFixMe
  const low = idx(result, _ => _._raw.records[0]._fields[0].low) || -1;
  return Promise.resolve(low);
}

export async function update(
  instance: ModelInstance<*>,
  label: ?string,
  props: any,
  whereProps: any
): Promise<any> {
  if (!label) {
    return Promise.reject(new Error("No relation label given"));
  }

  const { where, flatProps } = prepareWhere(whereProps, "b");
  const { str: setPropsStr, newProps } = this.src.prepareSetProps("b", props);

  const result = await trineo.run(
    `
    MATCH (a:${this.src.label} {guid:{_srcGuid}})-[c:${label}]->(b:${this.dest.label})
    ${where}
    SET ${setPropsStr}
    RETURN b
  `,
    { _srcGuid: instance.props.guid, ...flatProps, ...newProps }
  );

  return Promise.resolve(result.map(a => this.dest._createModelInstance(a.b)));
}

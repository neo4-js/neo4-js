// @flow
import trineo, { ModelInstance } from "./index";
import { prepareWhere, prepareSet } from "./utils";
import type { RelationType } from "./relation";

function getRelationString(label: string, relationType: RelationType) {
  if (relationType.any) {
    return `-[:${label}]-`;
  }
  return `${relationType.reverse ? "<" : ""}-[:${label}]-${relationType.reverse ? "" : ">"}`;
}

export async function get(
  instance: ModelInstance<*>,
  label: string,
  relationType: RelationType,
  props: any
): Promise<any> {
  const { where, flatProps } = prepareWhere(props, "b");

  const relationString = getRelationString(label, relationType);
  const result = await trineo.run(
    `
    MATCH (a:${this.src.label} {guid:{_srcGuid}})${relationString}(b:${this.dest.label})
    ${where}
    RETURN b
  `,
    { _srcGuid: instance.props.guid, ...flatProps }
  );

  return Promise.resolve(result.map(p => this.dest._createModelInstance(p.b)));
}

export async function create(
  instance: ModelInstance<*>,
  label: string,
  relationType: RelationType,
  propsArray: any[]
): Promise<any> {
  const destInstances = [];

  const relationString = getRelationString(label, relationType);
  for (const props of propsArray) {
    const destInstance = await this.dest.create(props);
    destInstances.push(destInstance);
    await trineo.run(
      `
      MATCH
        (a:${this.src.label} {guid:{srcGuid}}),
        (b:${this.dest.label} {guid:{destGuid}})
      MERGE (a)${relationString}(b)
    `,
      { srcGuid: instance.props.guid, destGuid: destInstance.props.guid }
    );
  }

  return Promise.resolve(destInstances);
}

export async function add(
  instance: ModelInstance<*>,
  label: string,
  relationType: RelationType,
  instances: ModelInstance<*>[]
): Promise<number> {
  const relationString = getRelationString(label, relationType);
  let relationshipsCreated = 0;
  for (const destInstance of instances) {
    const result = await trineo.run(
      `
      MATCH
        (a:${this.src.label} {guid:{srcGuid}}),
        (b:${this.dest.label} {guid:{destGuid}})
      MERGE (a)${relationString}(b)
    `,
      { srcGuid: instance.props.guid, destGuid: destInstance.props.guid }
    );

    relationshipsCreated += result._stats.relationshipsCreated;
  }

  return Promise.resolve(relationshipsCreated);
}

export async function count(
  instance: ModelInstance<*>,
  label: string,
  relationType: RelationType,
  props: any
): Promise<number> {
  const { where, flatProps } = prepareWhere(props, "b");

  const relationString = getRelationString(label, relationType);
  const result = await trineo.run(
    `
    MATCH (a:${this.src.label} {guid:{_srcGuid}})${relationString}(b:${this.dest.label})
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
  label: string,
  relationType: RelationType,
  props: any,
  whereProps: any
): Promise<any> {
  const { where, flatProps } = prepareWhere(whereProps, "b");
  const { str: setPropsStr, newProps } = prepareSet("b", props);

  const relationString = getRelationString(label, relationType);
  const result = await trineo.run(
    `
    MATCH (a:${this.src.label} {guid:{_srcGuid}})${relationString}(b:${this.dest.label})
    ${where}
    SET ${setPropsStr}
    RETURN b
  `,
    { _srcGuid: instance.props.guid, ...flatProps, ...newProps }
  );

  return Promise.resolve(result.map(a => this.dest._createModelInstance(a.b)));
}

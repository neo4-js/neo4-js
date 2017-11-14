// @flow
import neo4js, { ModelInstance } from "./index";
import { prepareWhere, prepareSet } from "./utils";
import { keys } from "lodash";
import type { RelationType } from "./relation";

const relationPropsKey = "relationProps";

function getRelationString(
  label: string,
  relationType: RelationType,
  relationProps?: any
) {
  let relationPropsStr = "";
  if (relationProps) {
    relationPropsStr = keys(relationProps)
      .map(key => `${key}: {${relationPropsKey}}.${key}`)
      .join(", ");
  }

  if (relationType.any) {
    return `-[r:${label} {${relationPropsStr}}]-`;
  }
  return `${!relationType.out && !relationType.any ? "<" : ""}-[r:${label} {${
    relationPropsStr
  }}]-${!relationType.out && !relationType.any ? "" : ">"}`;
}

export async function get(
  instance: ModelInstance<*>,
  label: string,
  relationType: RelationType,
  props: any,
  relationProps?: any
): Promise<any> {
  const { where, flatProps } = prepareWhere({ b: props, r: relationProps }, [
    "b",
    "r",
  ]);
  const relationString = getRelationString(label, relationType);
  const result = await neo4js.run(
    `
    MATCH (a:${this.src.label} {guid:{_srcGuid}})${relationString}(b:${
      this.dest.label
    })
    ${where}
    RETURN b, r
  `,
    { _srcGuid: instance.props.guid, ...flatProps }
  );

  return Promise.resolve(
    result.map(p => {
      const instance = this.dest._createModelInstance(p.b);
      instance.relationProps = p.r;
      return instance;
    })
  );
}

export async function remove(
  instance: ModelInstance<*>,
  label: string,
  relationType: RelationType,
  props: any,
  relationProps?: any
): Promise<any> {
  const { where, flatProps } = prepareWhere({ b: props, r: relationProps }, [
    "b",
    "r",
  ]);
  const relationString = getRelationString(label, relationType);
  const result = await neo4js.run(
    `
    MATCH (a:${this.src.label} {guid:{_srcGuid}})${relationString}(b:${
      this.dest.label
    })
    ${where}
    DELETE r
    `,
    { _srcGuid: instance.props.guid, ...flatProps }
  );

  return Promise.resolve(result._stats);
}

export async function create(
  instance: ModelInstance<*>,
  label: string,
  relationType: RelationType,
  propsArray: any[],
  relationProps?: any
): Promise<any> {
  const destInstances = [];

  const relationString = getRelationString(label, relationType, relationProps);
  for (const props of propsArray) {
    const destInstance = await this.dest.create(props);
    destInstances.push(destInstance);
    await neo4js.run(
      `
      MATCH
        (a:${this.src.label} {guid:{srcGuid}}),
        (b:${this.dest.label} {guid:{destGuid}})
      MERGE (a)${relationString}(b)
    `,
      {
        srcGuid: instance.props.guid,
        destGuid: destInstance.props.guid,
        relationProps,
      }
    );
  }

  return Promise.resolve(destInstances);
}

export async function add(
  instance: ModelInstance<*>,
  label: string,
  relationType: RelationType,
  instances: ModelInstance<*>[],
  relationProps?: any
): Promise<number> {
  const relationString = getRelationString(label, relationType, relationProps);
  let relationshipsCreated = 0;
  for (const destInstance of instances) {
    const result = await neo4js.run(
      `
      MATCH
        (a:${this.src.label} {guid:{srcGuid}}),
        (b:${this.dest.label} {guid:{destGuid}})
      MERGE (a)${relationString}(b)
    `,
      {
        srcGuid: instance.props.guid,
        destGuid: destInstance.props.guid,
        relationProps,
      }
    );

    relationshipsCreated += result._stats.relationshipsCreated;
  }

  return Promise.resolve(relationshipsCreated);
}

export async function count(
  instance: ModelInstance<*>,
  label: string,
  relationType: RelationType,
  props: any,
  relationProps?: any
): Promise<number> {
  const { where, flatProps } = prepareWhere({ b: props, r: relationProps }, [
    "b",
    "r",
  ]);

  const relationString = getRelationString(label, relationType);
  const result = await neo4js.run(
    `
    MATCH (a:${this.src.label} {guid:{_srcGuid}})${relationString}(b:${
      this.dest.label
    })
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
  whereProps: any,
  relationProps?: any,
  whereRelationProps?: any
): Promise<any> {
  const { where, flatProps } = prepareWhere(
    { b: whereProps, r: whereRelationProps },
    ["b", "r"]
  );
  const { str: setPropsStr, newProps } = prepareSet(
    {
      b: props,
      r: relationProps,
    },
    ["b", "r"]
  );
  const relationString = getRelationString(label, relationType);
  const result = await neo4js.run(
    `
    MATCH (a:${this.src.label} {guid:{_srcGuid}})${relationString}(b:${
      this.dest.label
    })
    ${where}
    SET ${setPropsStr}
    RETURN b
  `,
    { _srcGuid: instance.props.guid, ...flatProps, ...newProps }
  );

  return Promise.resolve(result.map(a => this.dest._createModelInstance(a.b)));
}

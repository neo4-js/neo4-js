import neo4js, { ModelInstance } from "./index";
import { prepareWhere, prepareSet, CharGenerator } from "./utils";
import { keys } from "lodash";
import { RelationType } from "./Relation";
import { Neo4jResultStats } from "./Types";
import { createModelInstance, createFakeModelInstance } from "./Model";

const relationPropsKey = "relationProps";

function getRelationString(
  label: string,
  relationType: RelationType,
  relationProps?: any,
  variable?: string
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
  return `${!relationType.out && !relationType.any ? "<" : ""}-[${variable ||
    "r"}:${label} {${relationPropsStr}}]-${
    !relationType.out && !relationType.any ? "" : ">"
  }`;
}

export function get(
  instance: ModelInstance<any>,
  label: string,
  relationType: RelationType,
  props: any,
  relationProps?: any,
  charGenerator?: CharGenerator,
  propertyName?: string
): Promise<any> | any {
  if (charGenerator) {
    // Return this to build a query with include
    const variable = charGenerator.next();
    const relationVariable = charGenerator.next();
    const relationString = getRelationString(
      label,
      relationType,
      null,
      relationVariable
    );
    const { where, flatProps } = prepareWhere(
      { [variable]: props, [relationVariable]: relationProps },
      [variable, relationVariable],
      charGenerator
    );

    return {
      model: this.dest,
      fakeInstance: createFakeModelInstance(this.dest, charGenerator),
      match: `${relationString}(${variable}:${this.dest.label}) ${where}`,
      flatProps,
      result: [variable, relationVariable],
      variable,
      relationVariable,
      propertyName,
    };
  }

  const relationString = getRelationString(label, relationType);
  const { where, flatProps } = prepareWhere({ b: props, r: relationProps }, [
    "b",
    "r",
  ]);
  return neo4js
    .run(
      `
    MATCH (a:${this.src.label} {guid:{_srcGuid}})${relationString}(b:${
        this.dest.label
      })
    ${where}
    RETURN b, r
  `,
      { _srcGuid: instance.props.guid, ...flatProps }
    )
    .then(result =>
      result.map(p => {
        const instance = createModelInstance(this.dest, p.b);
        // @ts-ignore
        instance.relationProps = p.r;
        return instance;
      })
    );
}

export async function remove(
  instance: ModelInstance<any>,
  label: string,
  relationType: RelationType,
  props: any,
  relationProps?: any
): Promise<Neo4jResultStats> {
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
  instance: ModelInstance<any>,
  label: string,
  relationType: RelationType,
  propsArray: any[],
  relationProps?: any
): Promise<any> {
  const destInstances = [];
  const relationString = getRelationString(label, relationType, relationProps);

  let _propsArray = propsArray;
  if (!Array.isArray(_propsArray)) {
    _propsArray = [_propsArray];
  }

  for (const props of _propsArray) {
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
  instance: ModelInstance<any>,
  label: string,
  relationType: RelationType,
  instances: ModelInstance<any>[] | ModelInstance<any>,
  relationProps?: any
): Promise<number> {
  const relationString = getRelationString(label, relationType, relationProps);
  let relationshipsCreated = 0;
  let _instances = instances;
  if (!Array.isArray(_instances)) {
    _instances = [_instances];
  }

  for (const destInstance of _instances) {
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
  instance: ModelInstance<any>,
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

  const low = result._raw.records[0]._fields[0].low || -1;
  return Promise.resolve(low);
}

export async function update(
  instance: ModelInstance<any>,
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
    RETURN b, r
  `,
    { _srcGuid: instance.props.guid, ...flatProps, ...newProps }
  );

  return Promise.resolve(
    result.map(p => {
      const instance = createModelInstance(this.dest, p.b);
      // @ts-ignore
      instance.relationProps = p.r;
      return instance;
    })
  );
}

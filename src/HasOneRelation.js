// @flow
import trineo, { ModelInstance } from './index';

export async function get(instance: ModelInstance<*>, label: ?string): Promise<any> {
  if (!label) {
    return Promise.reject(new Error('No relation label given'));
  }

  const result = await trineo.run(`
    MATCH (a:${this.src.label} {guid:{_srcGuid}})-[:${label}]-(b:${this.dest.label})
    RETURN b
  `, { _srcGuid: instance.props.guid });

  if (result.length === 0) {
    return Promise.resolve(null);
  }
  
  return Promise.resolve(this.dest._createModelInstance(result[0].b));
}

export async function create(instance: ModelInstance<*>, label: ?string, props: any): Promise<any> {
  if (!label) {
    return Promise.reject(new Error('No relation label given'));
  }

  const destInstance = await this.dest.create(props);

  // TODO: Not quite sure to keep this as the default behaviour...
  await trineo.run(`
    MATCH (a:${this.src.label} {guid:{srcGuid}})-[:${label}]->(b:${this.dest.label})
    DETACH DELETE b
  `, { srcGuid: instance.props.guid });

  await trineo.run(`
    MATCH
      (a:${this.src.label} {guid:{srcGuid}}),
      (b:${this.dest.label} {guid:{destGuid}})
    MERGE (a)-[:${label}]->(b)
  `, { srcGuid: instance.props.guid, destGuid: destInstance.props.guid });

  return Promise.resolve(destInstance);
}

export async function remove(instance: ModelInstance<*>, label: ?string): Promise<any> {
  if (!label) {
    return Promise.reject(new Error('No relation label given'));
  }

  const result = await trineo.run(`
    MATCH (a:${this.src.label} {guid:{srcGuid}})-[:${label}]->(b:${this.dest.label})
    DETACH DELETE b
  `, { srcGuid: instance.props.guid });

  // $FlowFixMe
  return Promise.resolve(result._stats);
}

export async function add(instance: ModelInstance<*>, label: ?string, destInstance: ModelInstance<*>): Promise<boolean> {
  if (!label) {
    return Promise.reject(new Error('No relation label given'));
  }

  const result = await trineo.run(`
    MATCH
      (a:${this.src.label} {guid:{srcGuid}}),
      (b:${this.dest.label} {guid:{destGuid}})
    MERGE (a)-[:${label}]->(b)
  `, { srcGuid: instance.props.guid, destGuid: destInstance.props.guid });

  // $FlowFixMe
  if (result._stats.relationshipsCreated === 1) {
    return Promise.resolve(true);
  }

  return Promise.resolve(false);
}

export async function hasOne(instance: ModelInstance<*>, label: ?string): Promise<boolean> {
  if (!label) {
    return Promise.reject(new Error('No relation label given'));
  }

  const result = await trineo.run(`
    MATCH
      (a:${this.src.label} {guid:{srcGuid}})-[:${label}]->(b:${this.dest.label})
    RETURN b
  `, { srcGuid: instance.props.guid });

  if (result.length === 1) {
    return Promise.resolve(true);
  } else if (result.length > 1) {
    return Promise.reject(new Error('HasOne relation has more than one relations'));
  }

  return Promise.resolve(false);
}

export async function update(instance: ModelInstance<*>, label: ?string, newProps: any): Promise<any> {
  if (!label) {
    return Promise.reject(new Error('No relation label given'));
  }

  let props = await trineo.run(`
    MATCH (a:${this.src.label} {guid:{srcGuid}})-[:${label}]->(b:${this.dest.label})
    RETURN b
  `, { srcGuid: instance.props.guid });

  if (props.length === 0) {
    return Promise.resolve(true);
  } else if (props.length > 1) {
    return Promise.reject(new Error('HasOne relation has more than one relations'));
  }
  props = props[0].b;

  const destInstance = await this.dest.update({ guid: props.guid }, newProps);
  if (destInstance.length === 1) {
    return Promise.resolve(destInstance[0]);
  }

  return Promise.reject(new Error('Problem with the update'));
}
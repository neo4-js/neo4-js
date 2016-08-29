import axios from 'axios';

function getInfo(routes, key, options) {
  return axios.get(routes[key], options)
    .then(({ data }) => data)
    .then(result => {
      return { [key]: result };
    });
}

function objectifyIndexes(indexes) {
  let o = {};
  for (let i of indexes) {
    o[i.label] = o[i.label] || {};
    for (let k of i.property_keys) {
      o[i.label][k] = { index: true };
    }
  }
  return o;
}

function objectifyConstraints(constraints) {
  let o = Object.assign({}, ...constraints.map(i => {
    return { [i.label]: {} };
  }));
  for (let c of constraints) {
    let label = o[c.label] || {};

    for (const prop of c.property_keys) {
      label[prop] = label[prop] || {};
      if (c.type === 'UNIQUENESS') {
        Object.assign(label[prop], { unique: true });
      } else if (c.type === 'NODE_PROPERTY_EXISTENCE') {
        Object.assign(label[prop], { exists: true });
      }
    }

    o[c.label] = label;
  }
  return o;
}

export function getSchemaInfo(url, port, auth) {
  const baseURL = `${url}:${port}/db/data/`;
  const infos = ['indexes', 'constraints'];

  return axios.get(baseURL, { auth })
    .then(({ data }) => data)
    .then(routes => {
      return Promise.all(infos.map(i => getInfo(routes, i, { auth })));
    })
    .then(results => {
      let o = {};
      for (const result of results) {
        o = { ...o, ...result };
      }
      return o;
    })
    .then(({ indexes, constraints }) => {
      indexes = objectifyIndexes(indexes);
      constraints = objectifyConstraints(constraints);
      return { indexes, constraints };
    })
    .then(({ indexes, constraints }) => {
      let infos = constraints;
      for(const label in indexes) {
        for(const prop in indexes[label]) {
          infos[label] = infos[label] || {};
          infos[label][prop] = infos[label][prop] || {};
          Object.assign(infos[label][prop], indexes[label][prop]);
        }
      }
      return infos;
    });
}

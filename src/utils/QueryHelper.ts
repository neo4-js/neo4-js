import { forIn } from "lodash";
import charGenerator, { CharGenerator } from "./CharGenerator";

const singlePredicates = {
  $sw: "STARTS WITH",
  $ew: "ENDS WITH",
  $contains: "CONTAINS",
  $reg: "=~",

  $eq: "=",
  $in: "IN",

  $gt: ">",
  $gte: ">=",
  $lt: "<",
  $lte: "<=",
};

function _prepareWhere(
  props: any,
  variable: string,
  cg?: CharGenerator
): { where: string[]; flatProps: any } {
  const where = [];
  let flatProps = {};

  if (!props) {
    return { where: [], flatProps: {} };
  }

  forIn(props, (v, k) => {
    const propChar = cg ? cg.next() : charGenerator.next();
    let found = false;

    if (v.$or) {
      found = true;
      const whereOr = [];
      for (const predicate of v.$or) {
        const tmp = _prepareWhere({ [k]: predicate }, variable, cg);
        whereOr.push(...tmp.where);
        flatProps = { ...flatProps, ...tmp.flatProps };
      }
      where.push(`(${whereOr.join(" OR ")})`);
    } else if (v.$and) {
      found = true;
      const whereAnd = [];
      for (const predicate of v.$and) {
        const tmp = _prepareWhere({ [k]: predicate }, variable, cg);
        whereAnd.push(...tmp.where);
        flatProps = { ...flatProps, ...tmp.flatProps };
      }
      where.push(`(${whereAnd.join(" AND ")})`);
    } else if (v.$not) {
      found = true;
      const tmp = _prepareWhere({ [k]: v.$not }, variable, cg);
      if (tmp.where.length) {
        where.push(`NOT ${tmp.where[0]}`);
        flatProps = { ...flatProps, ...tmp.flatProps };
      }
    } else if (v.$between) {
      found = true;
      if (v.$between.length === 2) {
        const [num1, num2] = v.$between;
        const a = propChar;
        const b = cg ? cg.next() : charGenerator.next();
        where.push(`{${a}} <= ${variable}.${k} <= {${b}}`);
        flatProps[a] = num1 > num2 ? num2 : num1;
        flatProps[b] = num1 > num2 ? num1 : num2;
      }
    } else {
      forIn(singlePredicates, (predicateString, predicateKey) => {
        const val = v[predicateKey];
        if (val || typeof val === "number" || typeof val === "string") {
          found = true;
          where.push(`${variable}.${k} ${predicateString} {${propChar}}`);
          flatProps[propChar] = v[predicateKey];
        }
      });
    }

    if (!found) {
      where.push(`${variable}.${k} = {${propChar}}`);
      flatProps[propChar] = v;
    }
  });

  return { where, flatProps };
}

export function prepareWhere(
  properties: any,
  variables: string | string[],
  cg?: CharGenerator
): { where: string | string[]; flatProps: any } {
  if (!cg) charGenerator.start("a");
  let vars: string[] = [];
  let props: any = {};
  if (typeof variables === "string") {
    vars = [variables];
    props[variables] = properties;
  } else if (Array.isArray(variables)) {
    vars = variables;
    props = properties;
  }

  let where = [];
  let flatProps = {};
  vars.forEach(variable => {
    const result = _prepareWhere(props[variable], variable, cg);
    where = where.concat(result.where);
    Object.assign(flatProps, result.flatProps);
  });

  if (where.length === 0) {
    return { where: "", flatProps: undefined };
  }

  return { where: "WHERE " + where.join(" AND "), flatProps };
}

export function prepareSet(
  properties: any,
  variables: string | string[]
): { str: string; newProps: any } {
  const sets = [];
  const newProps: any = {};
  let vars: string[] = [];
  let props: any = {};
  if (typeof variables === "string") {
    vars = [variables];
    props[variables] = properties;
  } else if (Array.isArray(variables)) {
    vars = variables;
    props = properties;
  }

  vars.forEach(variable => {
    forIn(props[variable], (v, k) => {
      if (k === "guid") return null;
      sets.push(`${variable}.${k}={_u_${variable}_${k}}`);
      newProps[`_u_${variable}_${k}`] = v;
    });
  });

  if (!sets.length) throw new Error(`Nothing to update`);

  return { str: sets.join(", "), newProps };
}

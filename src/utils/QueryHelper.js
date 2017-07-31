// @flow

import { forIn } from "lodash";
import { CharGenerator } from "./CharGenerator";

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
  variable: string
): { where: string[], flatProps: any } {
  const where = [];
  let flatProps = {};

  if (!props) {
    return { where: [], flatProps: {} };
  }

  forIn(props, (v, k) => {
    const propChar = CharGenerator.next();
    let found = false;

    if (v.$or) {
      found = true;
      const whereOr = [];
      for (const predicate of v.$or) {
        const tmp = _prepareWhere({ [k]: predicate }, variable);
        whereOr.push(...tmp.where);
        flatProps = { ...flatProps, ...tmp.flatProps };
      }
      where.push(`(${whereOr.join(" OR ")})`);
    } else if (v.$and) {
      found = true;
      const whereAnd = [];
      for (const predicate of v.$and) {
        const tmp = _prepareWhere({ [k]: predicate }, variable);
        whereAnd.push(...tmp.where);
        flatProps = { ...flatProps, ...tmp.flatProps };
      }
      where.push(`(${whereAnd.join(" AND ")})`);
    } else if (v.$not) {
      found = true;
      const tmp = _prepareWhere({ [k]: v.$not }, variable);
      if (tmp.where.length) {
        where.push(`NOT ${tmp.where[0]}`);
        flatProps = { ...flatProps, ...tmp.flatProps };
      }
    } else if (v.$between) {
      found = true;
      if (v.$between.length === 2) {
        const [num1, num2] = v.$between;
        const a = propChar;
        const b = CharGenerator.next();
        where.push(`{${a}} <= ${variable}.${k} <= {${b}}`);
        flatProps[a] = num1 > num2 ? num2 : num1;
        flatProps[b] = num1 > num2 ? num1 : num2;
      }
      // TODO error? flow should actually be able to handle this...
    } else {
      forIn(singlePredicates, (predicateString, predicateKey) => {
        if (v[predicateKey]) {
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
  props: any,
  variable: string
): { where: string, flatProps: any } {
  CharGenerator.start("a");
  const { where, flatProps } = _prepareWhere(props, variable);

  if (where.length === 0) {
    return { where: "", flatProps: undefined };
  }

  return { where: "WHERE " + where.join(" AND "), flatProps };
}

export function prepareSet(
  variable: string,
  props: any
): { str: string, newProps: any } {
  const sets = [];
  const newProps: any = {};

  forIn(props, (v, k) => {
    if (k === "guid") return null;
    sets.push(`${variable}.${k}={_u${k}}`);
    newProps[`_u${k}`] = v;
  });

  if (!sets.length) throw new Error(`Nothing to update`);

  return { str: sets.join(", "), newProps };
}

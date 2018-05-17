// @flow

import { forIn } from "lodash";

export type BaseProps = {
  guid?: string;
};

export class ModelInstance<T> {
  props: T & BaseProps;

  constructor(props: T) {
    this.props = props;

    forIn(this.props, (v, k) => {
      if (typeof v === "object") {
        if (v.low) {
          this.props[k] = v.low;
        }
      }
    });
  }
}

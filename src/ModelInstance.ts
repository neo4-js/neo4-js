import { forIn } from "lodash";

export type BaseProps = {
  guid?: string;
};

export class ModelInstance<T> {
  props: T & BaseProps;

  constructor(props: T) {
    this.props = props;
  }
}

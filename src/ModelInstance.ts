import { forIn } from "lodash";

export type BaseProps = {
  guid: string;
};

export class ModelInstance<T> {
  props: T & BaseProps;

  constructor(props: T & BaseProps) {
    this.props = props;
  }
}

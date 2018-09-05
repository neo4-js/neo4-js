export type BaseProps = {
  guid: string;
};

export class ModelInstance<T, R = {}> {
  props: T & BaseProps;
  relationProps: R;

  constructor(props: T & BaseProps) {
    this.props = props;
  }
}

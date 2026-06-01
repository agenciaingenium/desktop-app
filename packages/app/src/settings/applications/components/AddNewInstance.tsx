import { IconSymbol, Size, ButtonIcon, Style } from '@getstation/theme';
import React from 'react';

type DefaultProps = {
  instanceTypeWording: string,
  onClick: () => void,
};

type Props = DefaultProps & {
  name: string,
};

class AddNewInstance extends React.PureComponent<Props> {

  static defaultProps: DefaultProps = {
    instanceTypeWording: 'instance',
    onClick: () => { },
  };

  getWording() {
    const { instanceTypeWording, name } = this.props;

    const wording = instanceTypeWording === 'instance' ?
      `instance of ${name}` : instanceTypeWording;

    return `Add a new ${wording}`;
  }

  render() {
    const { onClick } = this.props;

    return (
      <div style={{ maxWidth: 300, margin: '20px 0' }}>
        <ButtonIcon
          text={this.getWording()}
          symbolId={IconSymbol.PLUS}
          btnStyle={Style.SECONDARY}
          btnSize={Size.XSMALL}
          onClick={onClick}
        />
      </div>
    );
  }
}

export default AddNewInstance;
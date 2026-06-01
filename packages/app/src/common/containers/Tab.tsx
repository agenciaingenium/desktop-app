import { roundedBackground } from '@getstation/theme';
import * as classNames from 'classnames';
import * as React from 'react';

type RenderFunction = () => React.ReactElement | React.ReactElement[];

export interface Props {
  children: RenderFunction,
  onClick?: () => void,
  title: string,
  isActive?: boolean,
}

class Tab extends React.PureComponent<Props, { hovered: boolean }> {
  constructor(props: Props) {
    super(props);
    this.state = { hovered: false };
  }

  render() {
    const { title, isActive } = this.props;
    const { hovered } = this.state;
    const showActiveBg = isActive || hovered;

    return (
      <li style={{
        lineHeight: '24px',
        marginBottom: 5,
        padding: '0 10px',
        boxSizing: 'border-box',
        cursor: 'pointer',
        userSelect: 'none' as const,
        backgroundColor: 'transparent',
        transition: '300ms',
        ...(showActiveBg ? roundedBackground('rgba(255, 255, 255, .1)') : {}),
      }}
        className={(classNames as any)({ active: isActive })}
        onMouseEnter={() => this.setState({ hovered: true })}
        onMouseLeave={() => this.setState({ hovered: false })}
      >
        <a onClick={this.props.onClick}>
          {title}
        </a>
      </li>
    );
  }
}

// @ts-ignore
export default (roundedBackground as any)('rgba(255, 255, 255, .1)')(Tab);
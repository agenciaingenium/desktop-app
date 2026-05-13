import { Icon, IconSymbol, roundedBackground, Tooltip } from '@getstation/theme';
import * as React from 'react';

export type Props = {
  className?: string,
  style?: React.CSSProperties,
  symbolId: IconSymbol,
  onClick: (e: React.MouseEvent<Element>) => void,
  size?: number,
  tooltip?: string,
  tooltipOffset?: string,
  tooltipPlacement?: string,
};

class SubdockButton extends React.PureComponent<Props, { hovered: boolean }> {
  constructor(props: Props) {
    super(props);
    this.state = { hovered: false };
  }

  renderIcon() {
    const { size, onClick, symbolId, className: upperClassName, style: upperStyle } = this.props;
    const { hovered } = this.state;
    return (
      <span
        className={upperClassName}
        style={{
          ...upperStyle,
          display: 'flex',
          height: 24,
          width: 24,
          opacity: hovered ? 1 : 0.5,
          marginLeft: 5,
          ...(hovered ? roundedBackground('rgba(255,255,255,0.2)') : {}),
        }}
        onMouseEnter={() => this.setState({ hovered: true })}
        onMouseLeave={() => this.setState({ hovered: false })}
      >
        <Icon
          style={{ display: 'flex' }}
          size={size}
          symbolId={symbolId}
          onClick={onClick}
        />
      </span>
    );
  }

  renderIconWithTooltip() {
    const { tooltip, tooltipOffset, tooltipPlacement } = this.props;
    return (
      <Tooltip
        tooltip={tooltip}
        offset={tooltipOffset || '0, 4'}
        placement={tooltipPlacement || 'top'}
        alternate={true}
      >
        {this.renderIcon()}
      </Tooltip>
    );
  }

  render() {
    const { tooltip } = this.props;
    if (tooltip) {
      return this.renderIconWithTooltip();
    }
    return this.renderIcon();
  }
}

export default SubdockButton;
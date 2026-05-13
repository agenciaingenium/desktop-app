import { GradientType, withGradient, ButtonIcon, IconSymbol, Style } from '@getstation/theme';
import * as classNames from 'classnames';
import * as React from 'react';
// @ts-ignore: no declaration file
import ClickOutside from 'react-click-outside';
// @ts-ignore: no declaration file
import KeyHandler, { KEYDOWN } from 'react-key-handler';

const noop = () => {};

type DefaultProps = {
  withClickOutside: boolean,
};

type HocProps = {
  themeGradient: string,
};

export type Props = HocProps & DefaultProps & {
  title?: string,
  onClose: (via: string) => void,
  children: React.ReactNode,
  contentClassName?: string,
  contentStyle?: React.CSSProperties,
  headClassName?: string,
  headStyle?: React.CSSProperties,
};

class Overlay extends React.PureComponent<Props & HocProps> {

  static defaultProps: DefaultProps = {
    withClickOutside: true,
  };

  renderChildren() {
    const { onClose, children, withClickOutside } = this.props;
    const onClickOutside = withClickOutside ? () => onClose('click') : noop;
    return (
      <ClickOutside onClickOutside={onClickOutside}>
        {children}
      </ClickOutside>
    );
  }

  render() {
    const { contentClassName, contentStyle, headClassName, headStyle, title, onClose, withClickOutside, themeGradient } = this.props;

    return (
      <div style={{
        position: 'fixed',
        display: 'flex',
        flexDirection: 'column',
        top: 0,
        bottom: 0,
        left: 50,
        right: 0,
        overflow: 'auto',
        zIndex: 100,
        backgroundImage: themeGradient,
        opacity: 1.00,
        color: 'white',
        borderLeft: '2px solid rgba(255, 255, 255, .4)',
        padding: '100px 40px 40px',
      }}>
        <KeyHandler
          keyEventName={KEYDOWN}
          keyValue="Escape"
          onKeyHandle={() => onClose('esc')}
        />
        <ButtonIcon
          onClick={withClickOutside ? noop : () => onClose('click')}
          symbolId={IconSymbol.CROSS}
          btnStyle={Style.SECONDARY}
          style={{ position: 'absolute', top: 40, left: 40 }}
          type="button"
        />
        { title &&
        <div className={headClassName} style={{ ...{ paddingBottom: '80px', fontSize: '14px', maxWidth: '1000px', width: '100%', display: 'flex', alignSelf: 'center' }, ...headStyle }}>
          <h1 style={{ flexGrow: 1 }}>{title}</h1>
        </div>
        }
        <div className={classNames('overlay-content', contentClassName)} style={{ ...{ flexGrow: 1, maxWidth: '1000px', alignSelf: 'center' }, ...contentStyle }}>
          {this.renderChildren()}
        </div>
      </div>
    );
  }
}

export default withGradient(GradientType.withOverlay)(Overlay);
import { ModalWrapper } from '@getstation/theme';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import DockApplication from '../common/containers/DockApplication';
import NativeAppDockIcon, { IconSymbol, Size } from '../dock/components/NativeAppDockIcon';
import { SHORTCUTS } from '../keyboard-shortcuts';
import BangSubdock from './BangSubdock';
import { SearchPaneClosedVia, setVisibility, toggleVisibility } from './duck';
import { isVisible as getIsBangVisible } from './selectors';
import classNames from 'classnames';

export interface OwnProps {
  onQuit: () => void,
}

export interface StateProps {
  isBangVisible: boolean,
}

export interface DispatchProps {
  hideBang: (via: SearchPaneClosedVia) => void,
  toggleBangVisibility: () => void,
}

export type Props = OwnProps & StateProps & DispatchProps;

class BangContainerImpl extends React.PureComponent<Props> {
  constructor(props: Props) {
    super(props);

    this.hide = this.hide.bind(this);
  }

  hide(e: React.SyntheticEvent<HTMLElement>) {
    if (e.type === 'click') {
      this.props.hideBang('click-outside');
    } else if (e.type === 'keydown') {
      this.props.hideBang('topbar_menu_or_keyboard_shortcut');
    }
  }

  render() {
    const { isBangVisible, toggleBangVisibility } = this.props;
    // remove the whitespace between ⌘ and T
    const kbd = SHORTCUTS.bang.kbd.replace(/\s/g, '');
    const toolTipText = `Quick switch  ${kbd}`;

    return (
      <DockApplication
        // @ts-ignore
        open={isBangVisible}
        // @ts-ignore
        onRequestClose={this.hide}
      >
        <NativeAppDockIcon
          className={(classNames as any)('appcues-bang-input')}
          // @ts-ignore
          iconSymbolId={IconSymbol.SEARCH}
          // @ts-ignore
          onClick={toggleBangVisibility}
          tooltip={isBangVisible ? undefined : toolTipText}
          // @ts-ignore
          size={Size.BIG}
          style={{ opacity: 0.6 }}
        />
        {/* @ts-ignore */}
        <ModalWrapper onClickOutside={this.hide} backgroundOverlay={false}>
          <BangSubdock onQuit={this.props.onQuit} />
        </ModalWrapper>
      </DockApplication>
    );
  }
}

// @ts-ignore
const BangContainer = (connect as any)(
  (state: any) => ({
    isBangVisible: getIsBangVisible(state),
  }),
  // @ts-ignore
  dispatch => bindActionCreators(
    {
      toggleBangVisibility: () => toggleVisibility('center-modal', 'dedicated_button'),
      hideBang: (via: SearchPaneClosedVia) => setVisibility('center-modal', false, via),
    },
    dispatch
  )
)(BangContainerImpl);

export default BangContainer;

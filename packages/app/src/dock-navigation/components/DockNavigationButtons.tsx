import { IconSymbol, Tooltip } from '@getstation/theme';
// @ts-ignore: no declaration file
import bind from 'memoize-bind';
import React from 'react';
import NativeAppDockIcon, { Size } from '../../dock/components/NativeAppDockIcon';
import { SHORTCUTS } from '../../keyboard-shortcuts';

export interface Props {
  canGoBack: boolean,
  canGoForward: boolean,
  onGoBack: () => any,
  onGoForward: () => any,
}

// remove the whitespace between ⌘ and T
const kbdBack = SHORTCUTS['page-go-back'].kbd.replace(/\s/g, '');
const kbdForth = SHORTCUTS['page-go-forward'].kbd.replace(/\s/g, '');
const tootipGoBack = `Go back ${kbdBack}`;
const tootipGoForth = `Go forward ${kbdForth}`;

export default class DockNavigationButtons extends React.PureComponent<Props, {}> {
  render() {
    const { canGoBack, canGoForward, onGoBack, onGoForward } = this.props;

    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '2px 0',
          height: 24,
        }}
      >
        <Tooltip tooltip={tootipGoBack} offset="0, 25">
          <NativeAppDockIcon
            iconSymbolId={IconSymbol.ARROW_LEFT}
            onClick={bind(() => canGoBack ? onGoBack() : null)}
            disabled={!canGoBack}
            size={Size.HALF}
          />
        </Tooltip>
        <Tooltip tooltip={tootipGoForth} offset="0, 5">
          <NativeAppDockIcon
            iconSymbolId={IconSymbol.ARROW_RIGHT}
            onClick={bind(() => canGoForward ? onGoForward() : null)}
            disabled={!canGoForward}
            size={Size.HALF}
          />
        </Tooltip>
      </div>
    );
  }
}

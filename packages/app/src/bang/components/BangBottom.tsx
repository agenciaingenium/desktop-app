import { Icon, IconSymbol } from '@getstation/theme';
import React from 'react';

export interface Props {
  onClickSettings?: () => void,
  ctrlTabCycling?: boolean,
  searchShortcut?: string,
  smallSize?: boolean,
}

const navigationIconStyle: React.CSSProperties = {
  marginRight: 4,
  padding: '2px 4px',
  color: 'white',
  background: 'rgba(255, 255, 255, .2)',
  borderRadius: 2,
  fontSize: 10,
};

export default class BangBottom extends React.PureComponent<Props, { settingsHover: boolean }> {
  constructor(props: Props) {
    super(props);
    this.state = { settingsHover: false };
  }

  render() {
    const { ctrlTabCycling, onClickSettings, smallSize, searchShortcut } = this.props;
    const { settingsHover } = this.state;

    return (
      <div style={{
        height: smallSize ? 28 : 35,
        backgroundColor: 'rgba(0, 0, 0, .2)',
        padding: smallSize ? '2px 5px 5px 10px' : '2px 5px 5px 10px',
        color: 'rgba(255, 255, 255, .8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: '1px solid rgba(255,255,255,0.3)',
      }}>
        <div style={{ display: 'flex' }}>
          <div style={{ fontSize: smallSize ? 8 : 10, marginRight: 10, color: 'rgba(255, 255, 255, .7)' }}>
            <span style={navigationIconStyle}>TAB</span>
            { !ctrlTabCycling &&
              <>
                <span style={navigationIconStyle}>↑</span>
                <span style={navigationIconStyle}>↓</span>
              </>
            }
            Navigate
          </div>

          <div style={{ fontSize: smallSize ? 8 : 10, marginRight: 10, color: 'rgba(255, 255, 255, .7)' }}>
            <span style={navigationIconStyle}>ESC</span>
            Close
          </div>
        </div>

        { searchShortcut &&
          <div style={{ fontSize: 10, color: 'rgba(255, 255, 255, .6)' }}>
            <span style={navigationIconStyle}>{searchShortcut}</span>
            Open
          </div>
        }

        { onClickSettings &&
          <a
            style={{
              marginTop: 2,
              height: 25,
              opacity: settingsHover ? 1 : 0.6,
              cursor: 'default',
              backgroundColor: settingsHover ? 'rgba(255, 255, 255, .2)' : undefined,
            }}
            onClick={onClickSettings}
            onMouseEnter={() => this.setState({ settingsHover: true })}
            onMouseLeave={() => this.setState({ settingsHover: false })}
          >
            <Icon
              symbolId={IconSymbol.COG}
              size={25}
              color="#fff"
            />
          </a>
        }
      </div>
    );
  }
}
import * as React from 'react';

interface Props {
  focused: boolean,
  handleClose: () => any,
  handleMinimize: () => any,
  handleExpand: () => any,
  dark?: boolean,
  allHover?: boolean,
}

export default class TrafficLights extends React.PureComponent<Props, {}> {
  renderDot(color: string, onClick: () => any) {
    const { dark, focused, allHover } = this.props;
    return (
      <div
        onClick={onClick}
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: allHover ? color : (dark ? '#000' : '#FFF'),
          opacity: allHover ? 1 : (focused ? 0.5 : 0.2),
          flex: '0 0 auto',
          transition: 'all 100ms ease-out',
          pointerEvents: 'auto',
          ...({ WebkitAppRegion: 'no-drag' } as React.CSSProperties),
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.opacity = '1';
          (e.currentTarget as HTMLDivElement).style.backgroundColor = color;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.opacity = String(allHover ? 1 : (focused ? 0.5 : 0.2));
          (e.currentTarget as HTMLDivElement).style.backgroundColor = allHover ? color : (dark ? '#000' : '#FFF');
        }}
      />
    );
  }

  render() {
    const { handleClose, handleMinimize, handleExpand } = this.props;

    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          flex: '0 0 auto',
          padding: 6,
          paddingBottom: 4,
          width: 50,
        }}
      >
        {this.renderDot('#FF6059', handleClose)}
        {this.renderDot('#FFBD2E', handleMinimize)}
        {this.renderDot('#29C941', handleExpand)}
      </div>
    );
  }
}

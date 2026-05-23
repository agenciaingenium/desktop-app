import * as React from 'react';
import { connect } from 'react-redux';
import { isOnline } from '../../app/selectors';
import { StationState } from '../../types';

interface Props {
  isOnline: boolean;
}

class OfflineBannerImpl extends React.PureComponent<Props> {
  render() {
    const { isOnline: currentOnline } = this.props;
    if (currentOnline) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: '#f5a623',
        color: '#fff',
        textAlign: 'center',
        padding: '8px 16px',
        fontSize: 14,
        fontWeight: 500,
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      }}>
        You are offline. Some features may be unavailable.
      </div>
    );
  }
}

export default connect<{ isOnline: boolean }, {}, {}, StationState>(
  (state: StationState) => ({
    isOnline: isOnline(state),
  })
)(OfflineBannerImpl);
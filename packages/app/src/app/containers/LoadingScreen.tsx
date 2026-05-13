import { GradientType, withGradient } from '@getstation/theme';
import * as React from 'react';
import DOMPurify from 'dompurify';
import { compose } from 'react-apollo';
import { connect } from 'react-redux';
import { CSSTransition } from 'react-transition-group';
import { StationState } from '../../types';
import { isLoadingScreenVisible } from '../selectors';

const announcementRaw = require('!!raw-loader!../../app/resources/announcement.html').default;
const announcementHTML = DOMPurify.sanitize(announcementRaw);

interface StateProps {
  visible: boolean
}

interface GradientProps {
  themeGradient?: string,
}

class LoadingScreenImpl extends React.PureComponent<StateProps & GradientProps, {}> {

  render() {
    const { visible } = this.props;
    return (
      <CSSTransition
        in={visible}
        classNames="fade"
        unmountOnExit={true}
        timeout={{ exit: 100 }}
        enter={false}
      >
        {this.renderContent()}
      </CSSTransition>
    );
  }

  renderContent() {
    const { themeGradient } = this.props;

    return (
      <div style={{
        position: 'fixed' as const,
        top: 0,
        bottom: 0,
        left: 50,
        right: 0,
        zIndex: 100,
        backgroundImage: themeGradient,
        padding: 10,
      }}>
        <div style={{
          display: 'flex',
          width: '100%',
          flexDirection: 'column' as const,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(255,255,255, 0.1)',
          borderRadius: 3,
          height: '100%',
          color: 'white',
          fontSize: 16,
          textAlign: 'center' as const,
        }}>
          <div style={{ fontSize: 16 }}>
            <p>
              Your Station will be ready soon...
            </p>
          </div>
          <div style={{
            marginTop: 30,
            color: 'rgba(255,255,255, 0.8)',
            fontSize: 14,
            maxWidth: 420,
          }} dangerouslySetInnerHTML={{ __html: announcementHTML }} />
        </div>
      </div>
    );
  }
}

export default compose(
  connect<StateProps, {}, {}>(
    (state: StationState) => ({
      visible: isLoadingScreenVisible(state) as boolean,
    })),
  withGradient(GradientType.normal)
)(LoadingScreenImpl);
import * as Immutable from 'immutable';
import * as React from 'react';
import { connect } from 'react-redux';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { bindActionCreators, compose } from 'redux';
import { markAsRead, notificationClick, toggleVisibility } from '../duck';
import { getFullNotificationsOrderedGrouped } from '../selectors';
import NotificationGroup from './NotificationGroup';

interface StateProps {
  groupedNotifications: Immutable.List<Immutable.Map<string, any>>,
}

interface DispatchProps {
  markAsRead: (notificationId: string) => void,
  onNotificationClick: (notificationId: string) => void,
  toggleVisibility: () => void,
}

export type Props = StateProps & DispatchProps;

const illuSVG = require('../components/resources/illustration--no-notif.svg');

const NoNotificationMessage = () => (
  <div className="l-empty">
    <div className="l-empty__content">
      <img src={illuSVG} width="117" height="138" alt="no notifications" />
      <strong>You have no notification</strong>
      <p>Congratulations, you did a great job catching up with all the news.</p>
    </div>
  </div>
);

export class NotificationCenterBodyImpl extends React.PureComponent<Props> {
  render() {
    const { groupedNotifications } = this.props;

    return (
      <div className="l-notification-center__body">
        {
          groupedNotifications.size === 0 && <NoNotificationMessage />
        }

        <TransitionGroup>
{groupedNotifications.toArray().map((group, key) =>
  <CSSTransition
              timeout={{ enter: 500, exit: 300 }}
              key={key}
            >
              {/* @ts-ignore */}
              {/* @ts-ignore */}
              {/* @ts-ignore */}
              {/* @ts-ignore */}
              {/* @ts-ignore */}
              {/* @ts-ignore */}
              {/* @ts-ignore */}
              <NotificationGroup as any
                icon={group.get('icon')}
                label={group.get('label')}
                badge={group.get('badge')}
                applicationName={group.get('applicationName')}
                applicationId={group.get('applicationId')}
                notifications={group.get('notifications')}
                onNotificationClick={this.props.onNotificationClick}
                markAsRead={this.props.markAsRead}
                toggleVisibility={this.props.toggleVisibility}
              />
            </CSSTransition>
          )}
        </TransitionGroup>
      </div>
    );
  }
}

const connector = compose(
  // @ts-ignore
  connect(
    // @ts-ignore
    (state: any) => ({
      groupedNotifications: getFullNotificationsOrderedGrouped(state),
    }),
    (dispatch: any) => bindActionCreators({
      onNotificationClick: (notificationId: string) => notificationClick(notificationId, 'notification_center'),
      toggleVisibility,
      markAsRead,
    }, dispatch)
  )
);

export default connector(NotificationCenterBodyImpl);

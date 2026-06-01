import { Icon, IconSymbol } from '@getstation/theme';
import Immutable from 'immutable';
import React from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { oc } from 'ts-optchain';
import AppIcon from '../../dock/components/AppIcon';
import { getNotificationId } from '../../notifications/get';
import { ImmutableNotification } from '../../notifications/types';
import NotificationItem from '../components/NotificationItem';
import { useGetApplicationQuery } from '../queries@local.gql.generated';

type OwnProps = {
  icon: string,
  applicationId?: string,
  notifications: Immutable.List<ImmutableNotification>,
  onNotificationClick: (notificationId: string) => void,
  markAsRead: (notificationId: string) => void,
  toggleVisibility: () => void,
};

const NotificationGroupInner: React.FC<OwnProps> = (props) => {
  const { applicationId, icon: fallbackIcon, notifications, markAsRead, onNotificationClick, toggleVisibility } = props;

  const { data, loading } = useGetApplicationQuery({
    variables: { applicationId: applicationId! },
    skip: !applicationId,
  });

  const application = oc(data).application;
  const manifest = application.manifestData;

  const applicationName = manifest.name();
  const icon = manifest.interpretedIconURL() || fallbackIcon;
  const badge = application.iconURL();
  const label = manifest.bx_multi_instance_config.instance_wording();
  const themeColor = manifest.theme_color();

  const markAsReadGroup = () => {
    notifications.forEach((notification: ImmutableNotification) => {
      markAsRead(getNotificationId(notification));
    });
  };

  if (loading) return null;

  return (
    <div
      className="l-notification-group"
    >
      <div className="l-notification-group__title">
        <div className="l-notification-item__image-wrapper">
          <AppIcon
            imgUrl={icon!}
            themeColor={themeColor!}
          />
          {badge &&
          <span className="l-dock__app__account">
                  <span style={{ backgroundImage: `url(${badge})` }}/>
                </span>
          }
        </div>
        <span className="l-notification-group__title-text">
                <span>{applicationName}</span>
                <small>{label}</small>
              </span>
        <span className="l-notification-group__title-actions">
                <Icon
                  symbolId={IconSymbol.MARK_READ}
                  size={24}
                  onClick={markAsReadGroup}
                  color="white"
                />
              </span>
      </div>
      <TransitionGroup>
        {notifications.toSeq().map((notification: ImmutableNotification) =>
          <CSSTransition
            key={getNotificationId(notification)}
            classNames="notification"
            timeout={{ enter: 500, exit: 300 }}
          >
            <NotificationItem
              notification={notification}
              markAsRead={markAsRead}
              onNotificationClick={onNotificationClick}
              toggleVisibility={toggleVisibility}
            />
          </CSSTransition>
        )
        }
      </TransitionGroup>
    </div>
  );
};

export default NotificationGroupInner;

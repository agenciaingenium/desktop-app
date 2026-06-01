import { Icon, IconSymbol } from '@getstation/theme';
import * as classNames from 'classnames';
import * as React from 'react';
import {
  getNotificationBody,
  getNotificationDateFromNow,
  getNotificationId,
  getNotificationTitle,
  isNotificationFull,
} from '../../notifications/get';
import { ImmutableNotification } from '../../notifications/types';

export interface Props {
  notification: ImmutableNotification,
  markAsRead(notificationId: string): void,
  toggleVisibility(): any,
  onNotificationClick(notificationId: string): void
}

class NotificationItem extends React.PureComponent<Props, { hovered: boolean }> {
  constructor(props: Props) {
    super(props);
    this.state = { hovered: false };
  }

  handleClickMarkAsRead = (e: React.MouseEvent<any>) => {
    const notificationId = getNotificationId(this.props.notification);
    e.stopPropagation();
    e.preventDefault();
    this.props.markAsRead(notificationId);
  }

  handleClick = () => {
    const notificationId = getNotificationId(this.props.notification);
    this.props.onNotificationClick(notificationId);
    this.props.toggleVisibility();
  }

  render() {
    const { notification } = this.props;
    const { hovered } = this.state;
    const body = getNotificationBody(notification);

    return (
      <div
        // @ts-ignore
        className={classNames(
          'l-notification-item',
          { 'l-notification-item-compact': !isNotificationFull(notification) })
        }
        style={{ cursor: 'default' }}
        onClick={this.handleClick}
        onMouseEnter={() => this.setState({ hovered: true })}
        onMouseLeave={() => this.setState({ hovered: false })}
      >
        <div className="l-notification-item__container">
          <div className="l-notification-item__content">
            <span className="l-notification-item__title">
              {getNotificationTitle(notification)}
            </span>
            {body &&
              `— ${body}`
            }
          </div>

          <div className="l-notification-item__footer">
            <span>{getNotificationDateFromNow(notification)}</span>
          </div>
        </div>
        <span style={{ display: 'inline-block', width: 24, height: 24 }}>
          <Icon
            style={{
              visibility: hovered ? 'visible' : 'hidden',
              borderRadius: '50%',
              fill: hovered ? 'white' : undefined,
              backgroundColor: hovered ? 'rgba(255, 255, 255, 0.3)' : undefined,
            }}
            symbolId={IconSymbol.CHECKMARK}
            // @ts-ignore
            onClick={this.handleClickMarkAsRead as any}
            // @ts-ignore
            size="24px"
            color={'rgba(255, 255, 255, 0.6)'}
          />
        </span>
      </div>
    );
  }
}

export default NotificationItem;
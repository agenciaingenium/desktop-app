import { Modal, theme } from '@getstation/theme';
import * as React from 'react';
import { compose } from 'redux';
import { oc } from 'ts-optchain';
import { withGetApplicationById } from '../queries@local.gql.generated';

export interface InjectedProps {
  loading: boolean | null,
  applicationName: string,
  applicationIcon: string,
  themeColor: string,
}

export interface OwnProps {
  applicationId: string,
  onContinue: () => void,
  onCancel: () => void,
}

export type Props = InjectedProps & OwnProps;

class AskAuthorizeNotificationsApplicationView extends React.PureComponent<Props> {
  render() {
    const { applicationName, applicationIcon, themeColor, loading, onContinue, onCancel } = this.props;

    if (loading) return null;

    return (
      <Modal
        title={`🔔 You just received your 1st notification from ${applicationName}`}
        onContinue={onContinue}
        continueContent={'Yes, I need those'}
        onCancel={onCancel}
        cancelContent={'No, let me focus'}
        applicationIcon={applicationIcon}
        themeColor={themeColor}
        onClickOutside={onContinue}
        classNameModalBody={{ paddingBottom: '10px !important' } as any}
      >
        <div style={{ textAlign: 'center' }}>
          <p>Would you like to allow {applicationName} to send you more ?</p>
        <br/>
        <p style={{ color: theme.colors.gray.middle }}>This can be changed later in the app's menu by hovering over the app icon.</p>
        <img style={{ margin: 15 }} src="static/illustrations/illustrations--notifications.svg"/>
        </div>
      </Modal>
    );
  }
}

const connector = compose(
  withGetApplicationById<OwnProps, InjectedProps>({
    options: (props) => ({ variables: { applicationId: props.applicationId } }),
    props: ({ data }) => ({
      loading: !data || data.loading,
      applicationName: oc(data).application.manifestData.name()!,
      applicationIcon: oc(data).application.manifestData.interpretedIconURL()!,
      themeColor: oc(data).application.manifestData.theme_color()!,
    }),
  }),
);

export default connector(AskAuthorizeNotificationsApplicationView);
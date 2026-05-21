import { Modal, theme } from '@getstation/theme';
import * as React from 'react';
import { oc } from 'ts-optchain';
import { useGetApplicationByIdQuery } from '../queries@local.gql.generated';

export interface OwnProps {
  applicationId: string,
  onContinue: () => void,
  onCancel: () => void,
}

const AskAuthorizeNotificationsApplicationView: React.FC<OwnProps> = ({ applicationId, onContinue, onCancel }) => {
  const { data, loading } = useGetApplicationByIdQuery({
    variables: { applicationId },
  });

  if (loading) return null;

  const applicationName = oc(data).application.manifestData.name()!;
  const applicationIcon = oc(data).application.manifestData.interpretedIconURL()!;
  const themeColor = oc(data).application.manifestData.theme_color()!;

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
};

export default AskAuthorizeNotificationsApplicationView;

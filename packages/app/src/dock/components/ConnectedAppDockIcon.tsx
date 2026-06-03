import React from 'react';
import { oc } from 'ts-optchain';
import { useGetApplicationQuery } from '../queries@local.gql.generated';
import { AppearingAppDockIcon, OwnProps } from './AppDockIcon';

const ConnectedAppDockIcon = (props: OwnProps) => {
  const { data, loading } = useGetApplicationQuery({
    variables: {
      applicationId: props.applicationId,
    },
  });

  const iconURL = oc(data).application.manifestData.interpretedIconURL() || undefined;
  console.log('[dock-icon]', props.applicationId?.slice(0, 8), 'loading:', loading, 'iconURL:', iconURL?.slice(0, 60));

  return (
    <AppearingAppDockIcon
      themeColor={oc(data).application.manifestData.theme_color() || undefined}
      loading={loading}
      iconURL={iconURL}
      snoozed={oc(data).application.isSnoozed()}
      {...props}
    />
  );
};

export default ConnectedAppDockIcon;

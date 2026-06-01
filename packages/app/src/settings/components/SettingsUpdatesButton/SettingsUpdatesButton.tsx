import { Button, Size } from '@getstation/theme';
import ms = require('ms');
import React from 'react';
import {
  useGetAutoUpdateStatusQuery, useCheckForUpdatesMutationMutation, useQuitAndInstallMutationMutation,
} from './queries@local.gql.generated';

const updateButtonStyle: React.CSSProperties = {
  minWidth: 200,
  marginTop: 2,
};

const checkingStyle: React.CSSProperties = {
  display: 'inline-block',
  position: 'relative' as const,
  top: 2,
  width: 10,
  height: 10,
  marginRight: 5,
  borderRadius: '100%',
  backgroundColor: 'transparent',
  border: '2px solid white',
  animation: '3s ease-in-out 0s infinite checking',
};

const infoStyle: React.CSSProperties = {
  marginTop: 5,
  fontSize: 11,
  color: 'rgba(255, 255, 255, .5)',
  textAlign: 'center' as const,
};

const SettingsUpdatesButton: React.FC = () => {
  const [justCheckedForUpdate, setJustCheckedForUpdate] = React.useState(false);
  const prevCheckingRef = React.useRef<boolean>(false);

  const { data } = useGetAutoUpdateStatusQuery();
  const [checkForUpdates] = useCheckForUpdatesMutationMutation();
  const [quitAndInstall] = useQuitAndInstallMutationMutation();

  const status = data?.autoUpdateStatus;
  const isDownloadingUpdate = status?.isDownloadingUpdate ?? false;
  const isCheckingUpdate = status?.isCheckingUpdate ?? false;
  const isUpdateAvailable = status?.isUpdateAvailable ?? false;
  const releaseName = status?.releaseName ?? null;

  // @ts-ignore
  React.useEffect(() => {
    if (prevCheckingRef.current && !isCheckingUpdate) {
      setJustCheckedForUpdate(true);
      const timer = setTimeout(() => setJustCheckedForUpdate(false), ms('1min'));
      return () => clearTimeout(timer);
    }
    prevCheckingRef.current = isCheckingUpdate;
  // @ts-ignore
  }, [isCheckingUpdate]);

  if (isCheckingUpdate) {
    return (
      <Button style={updateButtonStyle} btnSize={Size.SMALL} disabled={isCheckingUpdate}>
        <span style={checkingStyle} />
        {isDownloadingUpdate ? 'Downloading...' : 'Checking...'}
      </Button>
    );
  }

  if (isUpdateAvailable) {
    return (
      <div>
        <Button style={updateButtonStyle} btnSize={Size.SMALL} onClick={() => quitAndInstall({ variables: {} })} download={true}>
          Quit to install the latest version
        </Button>

        <p style={infoStyle}>New version available ({releaseName})</p>
      </div>
    );
  }

  if (!isUpdateAvailable && justCheckedForUpdate) {
    return (
      <div>
        <Button style={updateButtonStyle} btnSize={Size.SMALL} onClick={() => checkForUpdates({ variables: {} })}>
          No new updates
        </Button>

        <p style={infoStyle}>You have the most recent version</p>
      </div>

    );
  }

  return (
    <Button style={updateButtonStyle} btnSize={Size.SMALL} onClick={() => checkForUpdates({ variables: {} })}>
      Check for updates
    </Button>
  );
};

export default SettingsUpdatesButton;

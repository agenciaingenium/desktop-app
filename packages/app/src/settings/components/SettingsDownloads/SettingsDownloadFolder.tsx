import { Switcher, Button, Size } from '@getstation/theme';
import React from 'react';
import { isDarwin } from '../../../utils/process';
import { useGetPromptDownloadStatusQuery, useEnablePromptDownloadMutation } from './queries@local.gql.generated';

export type OwnProps = {
  onBrowseClick: () => void,
  onDownloadLocationClick: () => void,
  currentDownloadFolder?: string,
};

const SettingsDownloadFolder: React.FC<OwnProps> = ({ onBrowseClick, currentDownloadFolder, onDownloadLocationClick }) => {
  const [hoverFolder, setHoverFolder] = React.useState(false);
  const { data } = useGetPromptDownloadStatusQuery();
  const [enablePromptDownload] = useEnablePromptDownloadMutation();

  const promptDownloadEnabled = !!data && data.promptDownloadEnabled;

  const onTogglePromptDownload = (event: React.ChangeEvent<HTMLInputElement>) =>
    enablePromptDownload({ variables: { enabled: event.target.checked } });

  return (
    <section style={{
      display: 'flex',
      flexDirection: 'column',
      maxWidth: 600,
      paddingTop: 10,
      paddingBottom: 10,
    }}>
      <section style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', justifyContent: 'start' }}>
        <p style={{ marginBottom: 8, textTransform: 'uppercase', fontSize: 14, fontWeight: 'bold' }}>downloads</p>
        <section style={{ display: 'flex', justifyContent: 'start' }}>
          <label>Location:</label>
          <code
            title={`Reveal in ${isDarwin ? 'Finder' : 'Explorer'}`}
            style={{
              cursor: 'pointer',
              marginLeft: 10,
              lineHeight: '18px',
              display: 'inline',
              fontSize: 12,
              opacity: hoverFolder ? 0.9 : 0.5,
              transition: 'all 250ms ease-out',
            }}
            onClick={onDownloadLocationClick}
            onMouseEnter={() => setHoverFolder(true)}
            onMouseLeave={() => setHoverFolder(false)}
          >
            {currentDownloadFolder}
          </code>
          <aside style={{ marginLeft: 'auto' }}>
            <Button
              onClick={onBrowseClick}
              style={{ float: 'right' }}
              btnSize={Size.XXSMALL}
            >
              Change
            </Button>
          </aside>
        </section>
      </section>
      <section style={{ display: 'flex' }}>
        <label>Ask where to save each file before downloading</label>
        <aside style={{ marginLeft: 'auto' }}>
          <Switcher checked={promptDownloadEnabled} onChange={onTogglePromptDownload} />
        </aside>
      </section>
    </section>
  );
};

export default SettingsDownloadFolder;

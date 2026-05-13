import { Switcher, Button, Size } from '@getstation/theme';
import * as React from 'react';
import { compose } from 'redux';
import { isDarwin } from '../../../utils/process';
import { withGetPromptDownloadStatus, withEnablePromptDownload } from './queries@local.gql.generated';

export interface QueryProps{
  promptDownloadEnabled: boolean,
}

export interface MutationProps{
  togglePromptDownload: (enabled: boolean) => void,
}

export type OwnProps = {
  onBrowseClick: () => void,
  onDownloadLocationClick: () => void,
  currentDownloadFolder?: string,
};

export type Props = QueryProps & MutationProps & OwnProps;

class SettingsDownloadFolder extends React.PureComponent<Props, { hoverFolder: boolean }> {
  constructor(props: Props) {
    super(props);
    this.state = { hoverFolder: false };
  }

  render() {
    const { onBrowseClick, currentDownloadFolder, onDownloadLocationClick, promptDownloadEnabled } = this.props;
    const { hoverFolder } = this.state;
    const onTogglePromptDownload = (event: React.ChangeEvent<HTMLInputElement>) => this.props.togglePromptDownload(event.target.checked);
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
              onMouseEnter={() => this.setState({ hoverFolder: true })}
              onMouseLeave={() => this.setState({ hoverFolder: false })}
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
  }
}

const connect = compose(
  withGetPromptDownloadStatus({
    props:({ data }) => ({
      promptDownloadEnabled: !!data && data.promptDownloadEnabled,
    }),
  }),
  withEnablePromptDownload({
    props:({ mutate }): MutationProps => ({
      togglePromptDownload: (enabled: boolean) => mutate && mutate({ variables: { enabled } }),
    }),
  }),
);

export default connect(SettingsDownloadFolder) as React.ComponentType<OwnProps>;
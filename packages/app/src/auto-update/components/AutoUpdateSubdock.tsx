import { Button, theme } from '@getstation/theme';
import * as React from 'react';
import DOMPurify = require('dompurify');

const releaseNotesRaw = require('!!raw-loader!../../app/resources/release-notes.html').default;
const releaseNotesHTML = DOMPurify.sanitize(releaseNotesRaw);

export interface Props {
  updateAvailable: boolean,
  releaseName: string,
  onClickQuitAndInstall: () => any,
}

export default class AutoUpdateSubdock extends React.PureComponent<Props, {}> {
  render() {
    const { updateAvailable, releaseName, onClickQuitAndInstall } = this.props;

    return (
      <div style={{ position: 'relative' as const }}>
        <div style={{
          padding: 20,
          borderBottom: '1px solid rgba(255, 255, 255, .1)',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        }}>
          <img style={{ width: 40 }} src="static/illustrations/illustration--updates.svg" alt="" />
          <h1 style={{ marginTop: 30, ...theme.fontMixin(23) }}>What's new on {window.station.app.getName()}?</h1>
          <p style={{ opacity: 0.4 }}>
            You're now on version {window.station.app.getVersion()}
          </p>
        </div>

        <div style={{
          padding: 20,
        }}>
          { updateAvailable ?
            <div style={{
              fontWeight: 600,
              fontSize: 13,
              textAlign: 'center' as const,
            }}>
              <p>A new version is available 🎉</p>
              <p>({releaseName})</p>
              <Button
                onClick={onClickQuitAndInstall}
              >
                Quit to install the latest version
              </Button>
            </div>
            :
            <div className="auto-update-content" dangerouslySetInnerHTML={{ __html: releaseNotesHTML }} />
          }
        </div>
      </div>
    );
  }
}

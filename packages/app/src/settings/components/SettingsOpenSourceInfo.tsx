import { Button, Size } from '@getstation/theme';
import * as React from 'react';
import { openExternal } from '../../utils/shellRenderer';

const STYLE = {
  container: {
    maxWidth: '600px',
    paddingTop: '10px',
    paddingBottom: '10px',
  } as React.CSSProperties,
  item: {} as React.CSSProperties,
  settingName: {
    marginBottom: 8,
    textTransform: 'uppercase' as const,
    fontSize: 14,
    fontWeight: 'bold',
  } as React.CSSProperties,
  button: {
    marginTop: 10,
  } as React.CSSProperties,
};

export default class SettingsOpenSourceInfo extends React.PureComponent<{}, {}> {
  render() {
    return (
      <div style={STYLE.container}>
        <div style={STYLE.item}>
          <p style={STYLE.settingName}>open source info</p>
          <label>
            This software is maintained by the open source community. If you're a developer and want to contribute, check our Github.
          </label>
          <p>
            <Button
              onClick={() => openExternal('https://github.com/getstation/desktop-app')}
              className={STYLE.button}
              btnSize={Size.XXSMALL}
            >
              Open Github
            </Button>
          </p>
        </div>
      </div>
    );
  }
}
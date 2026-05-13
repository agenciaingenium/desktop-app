import { theme } from '@getstation/theme';
import * as React from 'react';
import { SHORTCUTS } from '../../../keyboard-shortcuts';
import SDKPortal from '../../../sdk/react/components/SDKPortal';
import FindBoostedAppsButton, { OwnProps as FindBoostedAppsButtonOwnProps } from './FindBoostedAppsButton';

const kbShortcut = SHORTCUTS.bang.kbd.replace(' ', '+');

type OwnProps = Pick<FindBoostedAppsButtonOwnProps, 'closeSettings'>;

const getDescription = (nbComponents: number): string => {
  if (nbComponents === 0) {
    return 'None of the apps you have installed have integrations with the Quick-Switch so far.';
  } else if (nbComponents > 0) {
    return 'You can search any document of those apps via the Quick-Switch, our unified search.';
  }
  return '';
};

const navigationIconStyle: React.CSSProperties = {
  marginRight: 4,
  padding: '2px 4px',
  background: 'rgba(255, 255, 255, .2)',
  borderRadius: 2,
  fontSize: 10,
};

type Props = OwnProps;

const SettingsQuickSwitch = (props: Props) => {
  const { closeSettings, ...restProps } = props;

  const [nbComponents, setNbComponents] = React.useState(-1);

  return (
    <>
      <div style={{ ...theme.titles.h1, marginBottom: 10, display: 'inline-block' }}>Quick-Switch</div>
      <div style={{ display: 'inline-block', paddingLeft: 10, transform: 'translateY(-3px)', fontSize: 10, color: 'rgba(255, 255, 255, .6)' }}>
        <span style={navigationIconStyle}>{kbShortcut}</span>
      </div>
      <div style={{ marginBottom: 30 }}>
        <p>{getDescription(nbComponents)}</p>
        {nbComponents === 0 &&
          <div style={{ marginTop: 20 }}>
            <FindBoostedAppsButton closeSettings={closeSettings} {...restProps} />
          </div>
        }
      </div>
      <SDKPortal id="portal-quickswitch" onComponentsChanged={setNbComponents} />
    </>
  );
};

export default SettingsQuickSwitch as React.ComponentType<OwnProps>;
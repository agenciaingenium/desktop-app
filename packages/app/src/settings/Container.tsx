import React from 'react';
import Tab from '../common/containers/Tab';
import Tabs from '../common/containers/Tabs';
import Overlay from '../components/Overlay';

import SettingsPanelGeneral from './components/SettingsPanelGeneral';
import SettingsQuickSwitch from './components/SettingsQuickSwitch';
import SettingsMyApps from './applications/SettingsMyApps';

export interface Props {
  setActiveTabTitle: (title: string) => void,
  setVisibility: (visibility: boolean) => void,
  activeTabTitle: string,
}

export default class SettingsOverlay extends React.PureComponent<Props, {}> {

  private modalIsOpened: boolean = false;

  constructor(props: Props) {
    super(props);
    this.setActiveTab = this.setActiveTab.bind(this);
    this.closeSettings = this.closeSettings.bind(this);
  }

  setActiveTab(title: string) {
    this.props.setActiveTabTitle(title);
  }

  closeSettings() {
    this.props.setVisibility(false);
  }

  handleModalStateChanged = (isOpened: boolean) => {
    this.modalIsOpened = isOpened;
  }

  onClose = (via: 'esc' | 'click') => {
    if (via === 'esc' && this.modalIsOpened) return;
    this.closeSettings();
  }

  render() {
    const { activeTabTitle } = this.props;

    return (
      <Overlay
        withClickOutside={false}
        onClose={this.onClose}
        title="Settings"
        headStyle={{ paddingBottom: 30 }}
        contentStyle={{
          display: 'flex',
          width: '100%',
          maxHeight: 'calc(100% - 64px)',
        }}
      >
        <Tabs
          setActiveTab={this.props.setActiveTabTitle}
          activeTabTitle={activeTabTitle}
        >
          <Tab title="General">
            {() => (
              <SettingsPanelGeneral />
            )}
          </Tab>
          <Tab title="Quick-Switch">
            {() => (
              <SettingsQuickSwitch closeSettings={this.closeSettings} />
            )}
          </Tab>
          <Tab title="My Apps">
            {() => (
              // @ts-ignore
              <SettingsMyApps onModalStateChanged={this.handleModalStateChanged} />
            )}
          </Tab>
        </Tabs>
      </Overlay>
    );
  }
}
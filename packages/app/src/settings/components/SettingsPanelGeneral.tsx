import { theme } from '@getstation/theme';
import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

// @ts-ignore: no declaration file
import { openProcessManager } from '../../app/duck';
import { areBetaIncludedInUpdates, getDownloadFolder } from '../../app/selectors';
import { clickBrowseDownloadFolder, revealPathInFinder } from '../../downloads/duck';
import { StationState } from '../../types';
import SettingsAutoLaunch from './SettingsAutoLaunch/SettingsAutoLaunch';
import SettingsDeveloperTools from './SettingsDeveloperTools';
import SettingsDownloadFolder from './SettingsDownloads/SettingsDownloadFolder';
import SettingsOpenSourceInfo from './SettingsOpenSourceInfo';
import SettingsUpdatesButton from './SettingsUpdatesButton/SettingsUpdatesButton';
import SettingsHideMainMenu from './SettingsHideMainMenu/SettingsHideMainMenu';
import SettingsMinimizeToTray from './SettingsMinimizeToTray/SettingsMinimizeToTray';
import { isDarwin, isWindows } from '../../utils/process';

export interface StateProps {
  downloadFolder?: string,
}

export interface DispatchProps {
  clickBrowseDownloadFolder: () => void,
  revealPathInFinder: (path?: string) => void,
  openProcessManager: () => void,
}

export interface MergeProps {
  onDownloadLocationClick: () => void,
}

type OwnProps = {};

type Props = OwnProps & StateProps & DispatchProps & MergeProps;

class SettingsPanelGeneralImpl extends React.PureComponent<Props, {}> {

  render() {
    return (
      <div>
        <div style={{ ...theme.titles.h2, display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            {window.station.app.getName()}
            <span style={{ marginLeft: 3, fontWeight: 400, opacity: 0.5 }}>version {window.station.app.getVersion()}</span>
          </div>

          <SettingsUpdatesButton />
        </div>

        <SettingsAutoLaunch />

        {!isDarwin && <SettingsHideMainMenu />}

        {isWindows && <SettingsMinimizeToTray />}

        <SettingsDownloadFolder
          currentDownloadFolder={this.props.downloadFolder}
          onBrowseClick={this.props.clickBrowseDownloadFolder}
          onDownloadLocationClick={this.props.onDownloadLocationClick}
        />

        <SettingsDeveloperTools
          onClickOpenProcessManager={this.props.openProcessManager}
        />

        <SettingsOpenSourceInfo/>

      </div>
    );
  }
}

const SettingsPanelGeneral = connect<StateProps, DispatchProps, MergeProps>(
  (state: StationState) => ({
    areBetaIncludedInUpdates: Boolean(areBetaIncludedInUpdates(state)),
    downloadFolder: getDownloadFolder(state),
  }),
  dispatch => bindActionCreators(
    {
      clickBrowseDownloadFolder,
      revealPathInFinder,
      openProcessManager,
    },
    dispatch
  ),
  (stateProps, dispatchProps, ownProps) => ({
    ...ownProps,
    ...stateProps,
    ...dispatchProps,
    onDownloadLocationClick: () =>
      dispatchProps.revealPathInFinder(stateProps.downloadFolder),
  })
)(SettingsPanelGeneralImpl) as any;

export default SettingsPanelGeneral as React.ComponentType<OwnProps>;
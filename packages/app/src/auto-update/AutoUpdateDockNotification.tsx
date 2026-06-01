import { IconSymbol } from '@getstation/theme';
import * as Immutable from 'immutable';
import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import DockApplicationSubdock from '../common/containers/DockApplicationSubdock';
import NativeAppDockIcon from '../dock/components/NativeAppDockIcon';
import AutoUpdateSubdock from './components/AutoUpdateSubdock';
// @ts-ignore no declaration file
import { openReleaseNotes, quitAndInstall, setReleaseNotesSubdockVisibility, toggleReleaseNotesSubdockVisibility } from './duck';
// @ts-ignore no declaration file
import { getReleaseName, isSubdockOpen as getIsSubdockOpen, isUpdateAvailable as getIsUpdateAvailable } from './selectors';

export interface Props {
  isUpdateAvailable: boolean,
  isSubdockOpen: boolean,
  autoUpdateVisible: boolean,
  releaseName: string,
  onClickQuitAndInstall: () => any,
  onClickOpenReleaseNotes: () => any
  onToggleReleaseNotesSubdockVisibility: () => any
  onSetReleaseNotesSubdockVisibility: (visible: boolean) => any
}

class AutoUpdateDockNotificationImpl extends React.PureComponent<Props, {}> {
  constructor(props: Props) {
    super(props);

    this.hideSubdock = this.hideSubdock.bind(this);
  }

  hideSubdock() {
    this.props.onSetReleaseNotesSubdockVisibility(false);
  }

  render() {
    const { isUpdateAvailable, autoUpdateVisible, isSubdockOpen } = this.props;

    const showIcon = isUpdateAvailable || autoUpdateVisible || isSubdockOpen;
    if (!showIcon) return null;

    return (
      <DockApplicationSubdock
        open={isSubdockOpen}
        onRequestClose={this.hideSubdock}
      >
        <NativeAppDockIcon
          className="appcues-subdock-autoupdate"
          iconSymbolId={IconSymbol.UPDATE}
          active={this.props.isSubdockOpen}
          onClick={this.props.onToggleReleaseNotesSubdockVisibility}
          badge={this.props.isUpdateAvailable}
        />
        <AutoUpdateSubdock
          updateAvailable={this.props.isUpdateAvailable}
          releaseName={this.props.releaseName}
          onClickQuitAndInstall={this.props.onClickQuitAndInstall}
        />
      </DockApplicationSubdock>
    );
  }
}

export default connect(
  (state: Immutable.Map<string, any>) => ({
    isUpdateAvailable: getIsUpdateAvailable(state),
    isSubdockOpen: getIsSubdockOpen(state),
    releaseName: getReleaseName(state),
    autoUpdateVisible: state.getIn(['ui', 'autoUpdate', 'visible'], false),
  }),
  (dispatch: Dispatch) => bindActionCreators({
    onClickQuitAndInstall: quitAndInstall,
    onClickOpenReleaseNotes: openReleaseNotes,
    onToggleReleaseNotesSubdockVisibility: toggleReleaseNotesSubdockVisibility,
    onSetReleaseNotesSubdockVisibility: (visible: boolean) => setReleaseNotesSubdockVisibility(visible),
  }, dispatch)
// @ts-ignore
)(AutoUpdateDockNotificationImpl);

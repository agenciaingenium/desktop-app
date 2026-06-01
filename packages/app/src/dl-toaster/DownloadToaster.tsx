import * as React from 'react';
import { connect } from 'react-redux';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { compose, bindActionCreators } from 'redux';
import { getThemeColors } from '../theme/selectors';
import { ImmutableList, ObjectToImmutable } from '../types';
import DownloadToast from './components/DownloadToast';
// @ts-ignore no declaration file
import { openDownloadedFile, removeToastForDownload } from './duck';
// @ts-ignore no declaration file
import { getFormatedDownloadsToShow } from './selectors';
import { Style, ButtonIcon, IconSymbol } from '@getstation/theme';

type DownloadItem = ObjectToImmutable<{
  downloadId: string,
  filename: string,
  completionPercent: number,
  applicationId: string,
  state: string,
}>;

export type Props = {
  downloads: ImmutableList<DownloadItem[]>,
  onOpenDownloadedFile: (downloadId: string) => void,
  onHideToasterClick: (downloadId: string) => void,
  themeColor: string,
};

const CONTAINER_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  position: 'fixed',
  bottom: '10px',
  right: '10px',
  zIndex: 9,
};

class DownloadToasterImpl extends React.PureComponent<Props, {}> {

  /**
   * Clear One or many Downloaded elements
   * @param downloads
   */
  handleClear(downloads: DownloadItem[]) {
    downloads.forEach(dl => {
      this.props.onHideToasterClick(dl.get('downloadId'));
    });
  }

  clearAllButton(downloads: Props['downloads']) {
    // ClearAll button only if there are min 2 dls
    if (downloads.size < 2) return null;
    return (
      <ButtonIcon
        text="Clear All"
        symbolId={IconSymbol.CROSS}
        btnStyle={Style.PRIMARY}
        btnSize={3}
        iconPosition="Right"
        onClick={this.handleClear.bind(this, downloads.toArray())}
      />
    );
  }

  render() {
    const { downloads, themeColor } = this.props;
    return (
      <div style={CONTAINER_STYLE}>
        {this.clearAllButton(downloads)}
        <TransitionGroup>
          { downloads.map((dl: DownloadItem) => (
            <CSSTransition
              key={dl.get('downloadId')}
              classNames="rapidfade"
              timeout={{ enter: 500, exit: 300 }}
            >
              <DownloadToast
                applicationId={dl.get('applicationId')}
                failed={dl.get('state') === 'interrupted' || dl.get('state') === 'cancelled'}
                filename={dl.get('filename')}
                completionPercent={dl.get('completionPercent')}
                onClickOpen={() => this.props.onOpenDownloadedFile(dl.get('downloadId'))}
                onClickHide={() => this.handleClear([dl])}
                themeColor={themeColor}
              />
            </CSSTransition>
          )).toArray()}
        </TransitionGroup>
      </div>
    );
  }
}

// @ts-ignore
const connector = compose(
  // @ts-ignore
  connect(
    (state: any) => ({
      downloads: getFormatedDownloadsToShow(state),
      themeColor: getThemeColors(state)[3],
    }),
    dispatch => bindActionCreators({
      onOpenDownloadedFile: openDownloadedFile,
      onHideToasterClick: removeToastForDownload,
    }, dispatch)
  ),
);

export default connector(DownloadToasterImpl);
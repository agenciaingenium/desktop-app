import { IconSymbol, Size, theme, ButtonIcon, Style } from '@getstation/theme';
import React from 'react';
import {
  StatusState,
  checkForUpdate,
} from '../../../chrome-extensions/duck';
import {
  ExtensionState,
} from '../../../chrome-extensions/types';

type Props = {
  extensionState: ExtensionState,
  onCheckForUpdate: typeof checkForUpdate,
};

type State = {
  updateWording: string,
};

class ExtensionInfos extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      updateWording: '',
    };

    this.checkForUpdate = this.checkForUpdate.bind(this);
  }

  componentDidMount() {
    this.updateWording(this.props);
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps !== this.props) {
      this.updateWording(this.props);
    }
  }

  updateWording(props: Props) {
    const {
      extensionState,
    } = props;

    const { status, extensionUpdate } = extensionState;

    switch (status) {
      case StatusState.Updatable:
        this.setState({
          updateWording: `An update (v${extensionUpdate!.version.number}) is available and will be applied when Station restarts`,
        });
        break;
      case StatusState.CheckingForUpdate:
        this.setState({
          updateWording: 'Checking for updates...',
        });
        break;
      case StatusState.Loaded:
        this.setState({
          updateWording: 'You have the most recent version',
        });
        break;
      default:
        break;
    }
  }

  checkForUpdate() {
    const {
      extensionState,
      onCheckForUpdate,
    } = this.props;

    const { extension } = extensionState;

    onCheckForUpdate(extension!);
  }

  render() {
    const {
      extensionState,
    } = this.props;

    const { updateWording } = this.state;

    return (
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        flexDirection: 'column',
        paddingBottom: 10,
      }}>
        <div style={{ ...theme.fontMixin(12, 600), margin: '20px 0 10px' }}>
          EXTENSION {extensionState && extensionState.extension && `V${extensionState.extension!.version.number}`}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'row' as const }}>
          <ButtonIcon
            text={'Check for updates'}
            symbolId={IconSymbol.UPDATE}
            btnStyle={Style.SECONDARY}
            btnSize={Size.XSMALL}
            onClick={this.checkForUpdate}
          />
          <i style={{ fontSize: 12, marginLeft: 15, maxWidth: '75%' }}>{updateWording}</i>
        </div>

      </div>
    );
  }
}

export default ExtensionInfos;
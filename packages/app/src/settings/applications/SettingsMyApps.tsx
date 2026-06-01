import React from 'react';
import { theme } from '@getstation/theme';
import memoize from 'memoizee';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
// @ts-ignore: no declaration file
import { updateUI } from '../../ui/redux-ui-compat';

import { orderedManifestsUrls } from '../../applications/selectors';
import { getUISettingsManifestURL } from '../../ui/selectors';
import App from './App';

const titleStyle: React.CSSProperties = {
  ...theme.titles.h1,
  marginBottom: 30,
};

type OwnProps = {
  onModalStateChanged: (isOpened: boolean) => void,
};

interface StateProps {
  manifestsUrls: string[],
  selectedManifestURL?: string,
}

interface DispatchProps {
  setSelectedManifestURL: (id?: string) => void,
  closeSettings: () => void,
}

type Props = OwnProps & StateProps & DispatchProps;

interface State {
  selectedManifestURL?: string,
}

const isModalOpened = (_state: State) => false;

const getManifestsOrder = (manifestsUrls: string[]) =>
  manifestsUrls.reduce(
    (slug: string, manifestsUrl) =>
      slug + manifestsUrl,
    ''
  );

class SettingsMyAppsImpl extends React.PureComponent<Props, State> {
  public state: State = {
    selectedManifestURL: undefined,
  };

  private readonly manifestURLsRef: Record<string, HTMLDivElement> = {};
  private mounted: boolean = false;

  // @ts-ignore
  refAttacher = memoize((manifestURL: string) => (node: HTMLDivElement | null) => {
    if (node) {
      this.manifestURLsRef[manifestURL] = node;
    }
  });

  componentDidMount() {
    this.mounted = true;

    setTimeout(
      () => this.scrollToSelectedManifestURL(),
      100
    );
  }

  // @ts-ignore
  componentDidUpdate(_: Props, prevState: State) {
    const isOpened = !isModalOpened(prevState) && isModalOpened(this.state);

    if (isOpened) {
      this.props.onModalStateChanged(true);
    }

    this.props.onModalStateChanged(false);
  }

  safeSetState(newState: Partial<State>) {
    if (this.mounted) {
      this.setState(newState as any);
    }
  }

  scrollToSelectedManifestURL = async () => {
    if (this.props.selectedManifestURL) {
      const manifestRef = this.manifestURLsRef[this.props.selectedManifestURL];

      if (manifestRef) {
        manifestRef.scrollIntoView({ behavior: 'smooth' });
        await new Promise(resolve => setTimeout(resolve, 100));
        this.safeSetState({ selectedManifestURL: this.props.selectedManifestURL });
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.safeSetState({ selectedManifestURL: undefined });
      }
    }
  }

  componentWillUnmount() {
    this.mounted = false;
    this.props.setSelectedManifestURL(undefined);
  }

  // @ts-ignore
  componentDidUpdate2(prevProps: Props) {
    const selectedManifestURL = this.props.selectedManifestURL;

    if (selectedManifestURL) {
      const prevAppOrder = getManifestsOrder(prevProps.manifestsUrls);
      const currentAppOrder = getManifestsOrder(this.props.manifestsUrls);

      if (prevAppOrder !== currentAppOrder) {
        setImmediate(() => this.scrollToSelectedManifestURL());
      }
    }
  }

  render() {
    const { manifestsUrls } = this.props;

    const items = manifestsUrls.map(manifestURL => (
      <App
        key={manifestURL}
        manifestURL={manifestURL}
        attachAppRef={this.refAttacher(manifestURL)}
        closeSettings={this.props.closeSettings}
      />
    ));

    return (
      <div>
        <div style={titleStyle}>My Apps</div>

        <div>
          {items}
        </div>
      </div>
    );
  }
}

// @ts-ignore
// @ts-ignore
// @ts-ignore
// @ts-ignore
// @ts-ignore
// @ts-ignore
const SettingsMyApps = connect<StateProps, DispatchProps>(
  // @ts-ignore
  (state: any) => ({
    manifestsUrls: orderedManifestsUrls(state),
    selectedManifestURL: getUISettingsManifestURL(state),
  }),
  // @ts-ignore
  (dispatch: any) => bindActionCreators(
    {
      setSelectedManifestURL: (manifestURL?: string) =>
        updateUI('settings', 'selectedManifestURL', manifestURL),
      closeSettings: () => updateUI('settings', 'isVisible', false),
    },
    dispatch
  ),
  null as any,
  { forwardRef: true } as any,
)(SettingsMyAppsImpl as any) as any;

// @ts-ignore
export default SettingsMyApps;
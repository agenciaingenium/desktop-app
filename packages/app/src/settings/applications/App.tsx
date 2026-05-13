import { Hint, IconSymbol, Size, Switcher, TEXT, theme, Tooltip, ButtonIcon, Style } from '@getstation/theme';
import * as classNames from 'classnames';
import { List } from 'immutable';
import * as React from 'react';
import { compose } from 'react-apollo';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { oc } from 'ts-optchain';
import { uninstallAllInstances } from '../../abstract-application/duck';
import { withCheckForUpdatesApplicationMutation, withGetAbstractApplication } from '../../abstract-application/queries@local.gql.generated';
import { setAlwaysLoaded, setInstanceLogoInDock } from '../../application-settings/duck';
import { changeSelectedApp, installApplication, uninstallApplication } from '../../applications/duck';
import { checkForUpdate } from '../../chrome-extensions/duck';
import { getExtensionState } from '../../chrome-extensions/selectors';
import { ExtensionState } from '../../chrome-extensions/types';
import AppIcon from '../../dock/components/AppIcon';
import { removeLink } from '../../password-managers/duck';
import { StationState } from '../../types';
import AddNewInstance from '../applications/components/AddNewInstance';
import ApplicationExtensions from '../applications/components/ApplicationExtensions';
import ListInstances from '../applications/components/ListInstances';
import { getApplicationsForDock } from '../../dock/selectors';
import RemoveModalConfirmation from '../applications/components/RemoveModalConfirmation';
import { Extension, Instance, Instances } from './types';
import ExtensionInfos from './components/ExtensionInfos';
import { pure } from 'recompose';

type DefaultProps = {
  highlighted: boolean,
  alwaysLoaded: boolean,
  alwaysLoadedByDefault: boolean,
  applicationName: string,
  applicationIcon: string,
  applicationThemeColor: string,
  applicationCxExtensionId?: string,
  instanceWording: string,
  instances: Instances,
  extensions: Extension[],
  useInstanceLogoInDock: boolean,
  applications: Instances,
};

type OwnProps = DefaultProps & {
  manifestURL: string,

  attachAppRef: (node: HTMLDivElement) => any,
  closeSettings: (
    manifestURL: string,
    applicationName: string,
    via: 'add-account' | 'configure-account'
  ) => any,
};

interface StateProps {
  extensionState?: ExtensionState,
}

interface DispatchProps {
  onRemoveAllInstances: () => any,
  onAddNewInstance: () => any,
  onRemoveInstance: (instanceId: string) => any,
  onConfigureInstance: (instanceId: string) => any,
  onUnlinkPasswordManager: () => any,
  onExtensionToggle: (extensionManifestURL: string, added: boolean) => any,
  onToggleInstanceLogoInDock: () => any,
  onToogleAutoSleep: (event: React.FormEvent<HTMLInputElement>) => any,
  onExtensionCheckForUpdate: typeof checkForUpdate,
}

type Props = OwnProps & StateProps & DispatchProps;

interface State {
  removeApplication: boolean,
  instancesToRemove: Instances,
  lastInstance: boolean,
  removeAction: () => any
}

const itemStyle: React.CSSProperties = {
  marginBottom: 20,
  padding: 20,
  backgroundColor: 'rgba(255, 255, 255, 0.10)',
  borderRadius: 6,
  transition: 'background-color 300ms ease-in',
};

const highlightedItemStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.50)',
  transition: 'background-color 300ms ease-out',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  width: '100%',
  alignItems: 'center',
  paddingBottom: 20,
};

const appTitleStyle: React.CSSProperties = {
  ...theme.titles.h2,
  marginLeft: 10,
  marginRight: 20,
};

const subtitleStyle: React.CSSProperties = {
  ...theme.fontMixin(12, 600),
  margin: '20px 0 10px',
};

const descriptionWrapperStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
};

const instancesContainerStyle: React.CSSProperties = {
  margin: '20px 0',
};

const buttonRemoveAllStyle: React.CSSProperties = {
  backgroundColor: 'rgba(0, 0, 0, 0.25)',
};

class AppImpl extends React.PureComponent<Props, State> {
  static defaultProps: DefaultProps = {
    highlighted: false,
    alwaysLoaded: false,
    alwaysLoadedByDefault: false,
    applicationName: '',
    applicationIcon: '',
    applicationThemeColor: '',
    applicationCxExtensionId: undefined,
    instanceWording: 'instance',
    instances: List([]),
    extensions: [],
    useInstanceLogoInDock: false,
    applications: List([]),
  };

  static defaultState: State = {
    removeApplication: false,
    instancesToRemove: List([]),
    lastInstance: false,
    removeAction: () => { },
  };

  constructor(props: Props) {
    super(props);

    this.state = AppImpl.defaultState;
  }

  onToggleAutoSleep = (
    event: React.FormEvent<HTMLInputElement>,
  ) => {
    this.props.onToogleAutoSleep(event);
  }

  onConfirmRemoveApplication = () => this.setState({
    ...AppImpl.defaultState,
    removeApplication: true,
    instancesToRemove: this.props.instances,
    removeAction: () => {
      this.props.onRemoveAllInstances();
      this.setState(AppImpl.defaultState);
    },
  })

  onConfirmRemoveInstance = (id: string) => this.setState({
    ...AppImpl.defaultState,
    instancesToRemove: this.props.instances.filter((i: Instance) => i.id === id),
    lastInstance: this.props.instances.count() === 1,
    removeAction: () => {
      this.props.onRemoveInstance(id);
      this.setState(AppImpl.defaultState);
    },
  })

  onCancelConfirmation = () => this.setState(AppImpl.defaultState);

  render() {
    const {
      highlighted,
      alwaysLoaded,
      alwaysLoadedByDefault,
      manifestURL,
      applicationName,
      applicationIcon,
      applicationThemeColor,
      instanceWording,
      instances,
      extensions,
      useInstanceLogoInDock,
      attachAppRef,
      onAddNewInstance,
      onConfigureInstance,
      onUnlinkPasswordManager,
      onExtensionToggle,
      onToggleInstanceLogoInDock,
      onExtensionCheckForUpdate,
      applications,
      extensionState,
    } = this.props;

    const {
      removeApplication,
      instancesToRemove,
      lastInstance,
      removeAction,
    } = this.state;

    return (
      <div
        ref={attachAppRef}
        key={manifestURL}
        className={classNames('settings-app-item', { highlighted })}
        style={highlighted ? { ...itemStyle, ...highlightedItemStyle } : itemStyle}
      >
        {(removeApplication || instancesToRemove.count() > 0) &&
          <RemoveModalConfirmation
            applicationName={applicationName}
            instanceTypeWording={instanceWording}
            allInstancesRemoved={removeApplication || lastInstance}
            instancesToRemove={instancesToRemove}
            onContinue={removeAction}
            onCancel={this.onCancelConfirmation}
          />
        }

        <div style={headerStyle}>
          <AppIcon
            imgUrl={applicationIcon}
            themeColor={applicationThemeColor}
          />

          <div style={appTitleStyle}>
            {applicationName}
          </div>
          <Tooltip
            style={{ marginLeft: 'auto' }}
            tooltip={'Remove app'}
            offset="-2, 12"
            placement={'left'}
          >
            <ButtonIcon
              style={buttonRemoveAllStyle}
              iconColor="white"
              btnStyle={Style.SECONDARY}
              symbolId={IconSymbol.TRASH}
              btnSize={Size.SMALL}
              onClick={this.onConfirmRemoveApplication}
            />
          </Tooltip>
        </div>

        {extensionState &&
          <div>
            <ExtensionInfos
              extensionState={extensionState}
              onCheckForUpdate={onExtensionCheckForUpdate}
            />
          </div>
        }

        <div style={instancesContainerStyle}>
          <div style={{ marginBottom: '20px' }} >
            <ListInstances
              applications={applications}
              manifestURL={manifestURL}
              instanceTypeWording={instanceWording}
              onRemoveInstance={this.onConfirmRemoveInstance}
              onUnlinkPasswordManager={onUnlinkPasswordManager}
              onConfigureInstance={onConfigureInstance}
              instances={instances}
            />
          </div>

          <AddNewInstance
            name={applicationName}
            instanceTypeWording={instanceWording}
            onClick={onAddNewInstance}
          />
        </div>

        <ApplicationExtensions
          extensions={extensions}
          onExtensionToggle={onExtensionToggle}
        />

        <div style={subtitleStyle}>
          DOCK ICON
        </div>

        <div style={descriptionWrapperStyle} >
          <div>
            When available, use {instanceWording} logo in the dock
          </div>

          <Switcher
            checked={useInstanceLogoInDock}
            onChange={onToggleInstanceLogoInDock}
            text={TEXT.YES_NO}
          />
        </div>

        <div style={subtitleStyle}>
          <Hint tooltip="By default, Station puts to sleep unused applications in order to preserve memory and prevent slow-downs.">
            BACKGROUND ACTIVITY
          </Hint>
        </div>

        <div style={descriptionWrapperStyle}>
          <div>
            Keep {applicationName} active in background to receive calls and notifications.
          </div>
          <div>
            <Switcher
              checked={alwaysLoadedByDefault ? true : alwaysLoaded}
              disabled={alwaysLoadedByDefault}
              disabledHint={`${applicationName} is always kept active in background`}
              onChange={this.onToggleAutoSleep}
              text={TEXT.YES_NO}
            />
          </div>
        </div>
      </div>
    );
  }
}

const App = compose(
  // React Apollo HOC are not pure
  // let's wrap this in a pure component so that we get a performance boost
  pure,
  withGetAbstractApplication({
    options: ({ manifestURL }: Props) => ({
      variables: { manifestURL },
    }),
    props: ({ data }) => {
      if (data) {
        const abstractApplication = oc(data).abstractApplication;
        const manifest = abstractApplication.manifest;
        const settings = abstractApplication.settings;
        const instances = abstractApplication.instances;
        const extensions = abstractApplication.extensions;

        if (manifest() && settings() && extensions()) {
          return {
            alwaysLoadedByDefault: manifest.bx_keep_always_loaded(),
            alwaysLoaded: settings.alwaysLoaded(),
            applicationName: manifest.name(),
            applicationIcon: manifest.interpretedIconURL(),
            applicationThemeColor: manifest.theme_color(),
            applicationCxExtensionId: manifest.cxExtensionId(),
            instanceWording: manifest.bx_multi_instance_config!.instance_wording(),
            instances: List(instances()),
            extensions: extensions(),
            useInstanceLogoInDock: settings.instanceLogoInDock(),
          };
        }
      }
      return {};
    },
  }),
  withCheckForUpdatesApplicationMutation({
    props: ({ mutate, ownProps }) => ({
      checkForUpdatesApplication: () =>
        // @ts-ignore manifestURL exists on ownpropsw
        mutate && mutate({ variables: { manifestURL: ownProps.manifestURL } }),
    }),
  }),
  connect<StateProps, DispatchProps, OwnProps>(
    (state: StationState, props: DefaultProps) => ({
      extensionState: props.applicationCxExtensionId ? getExtensionState(state, props.applicationCxExtensionId) : undefined,
      applications: getApplicationsForDock(state),
    }),
    // @ts-ignore
    (dispatch: Dispatch<any>, ownProps: OwnProps) => {
      const {
        manifestURL,
        applicationName,
        closeSettings,
      } = ownProps;

      return bindActionCreators(
        {
          onRemoveAllInstances: () => {
            return uninstallAllInstances(manifestURL);
          },
          onRemoveInstance: (id) => {
            return uninstallApplication(id);
          },
          onAddNewInstance: () => {
            closeSettings(manifestURL, applicationName, 'add-account');
            return installApplication(manifestURL, { navigate: true });
          },
          onConfigureInstance: (id: string) => {
            closeSettings(id, applicationName, 'configure-account');
            return changeSelectedApp(id);
          },
          onUnlinkPasswordManager: (applicationId: string) => removeLink({ applicationId }),
          onExtensionToggle: (extensionManifestURL: string, added: boolean) => {
            if (added) {
              return installApplication(extensionManifestURL);
            }

            return uninstallAllInstances(extensionManifestURL);
          },
          onToggleInstanceLogoInDock: (event: React.FormEvent<HTMLInputElement>) => {
            // @ts-ignore checked exists
            const checked = event.target.checked;

            return setInstanceLogoInDock(manifestURL, checked);
          },
          onToogleAutoSleep: (event: React.FormEvent<HTMLInputElement>) => {
            // @ts-ignore checked exists
            const checked = event.target.checked;
            return setAlwaysLoaded(manifestURL, checked);
          },
          onExtensionCheckForUpdate: checkForUpdate,
        },
        dispatch
      );
    },
    null,
    { forwardRef: true },
  ),
)(AppImpl);

export default App;
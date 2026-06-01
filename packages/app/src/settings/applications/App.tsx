import { Hint, IconSymbol, Size, Switcher, TEXT, theme, Tooltip, ButtonIcon, Style } from '@getstation/theme';
import * as classNames from 'classnames';
import { List } from 'immutable';
import * as React from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { bindActionCreators } from 'redux';
import { oc } from 'ts-optchain';
import { uninstallAllInstances } from '../../abstract-application/duck';
import { useCheckForUpdatesApplicationMutationMutation, useGetAbstractApplicationQuery } from '../../abstract-application/queries@local.gql.generated';
import { setAlwaysLoaded, setInstanceLogoInDock } from '../../application-settings/duck';
import { changeSelectedApp, installApplication, uninstallApplication } from '../../applications/duck';
import { checkForUpdate } from '../../chrome-extensions/duck';
import { getExtensionState } from '../../chrome-extensions/selectors';
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

type OwnProps = {
  highlighted?: boolean,
  manifestURL: string,
  attachAppRef: (node: HTMLDivElement) => any,
  closeSettings: (
    manifestURL: string,
    applicationName: string,
    via: 'add-account' | 'configure-account'
  ) => any,
};

const defaultRemoveState = {
  removeApplication: false,
  instancesToRemove: List([]) as Instances,
  lastInstance: false,
  removeAction: () => { },
};

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

const App: React.FC<OwnProps> = ({ highlighted = false, manifestURL, attachAppRef, closeSettings }) => {
  const [removeState, setRemoveState] = React.useState(defaultRemoveState);

  const { data } = useGetAbstractApplicationQuery({
    variables: { manifestURL },
  });
  const [_checkForUpdatesApplication] = useCheckForUpdatesApplicationMutationMutation();

  const abstractApplication = oc(data).abstractApplication;
  const manifest = abstractApplication.manifest;
  const settings = abstractApplication.settings;
  const instancesData = abstractApplication.instances;
  const extensionsData = abstractApplication.extensions;

  const alwaysLoadedByDefault = manifest.bx_keep_always_loaded() ?? false;
  const alwaysLoaded = settings.alwaysLoaded() ?? false;
  const applicationName = manifest.name() ?? '';
  const applicationIcon = manifest.interpretedIconURL() ?? '';
  const applicationThemeColor = manifest.theme_color() ?? '';
  const applicationCxExtensionId = manifest.cxExtensionId() ?? undefined;
  const instanceWording = manifest.bx_multi_instance_config?.instance_wording() ?? 'instance';
  const instances: Instances = List(instancesData() ?? []) as any;
  const extensions: Extension[] = extensionsData() ?? [] as any;
  const useInstanceLogoInDock = settings.instanceLogoInDock() ?? false;

  const extensionState = useSelector((state: StationState) =>
    applicationCxExtensionId ? getExtensionState(state, applicationCxExtensionId) : undefined
  );
  const applications = useSelector((state: StationState) => getApplicationsForDock(state), shallowEqual);

  const dispatch = useDispatch();
  const boundActions = React.useMemo(() => bindActionCreators({
    onRemoveAllInstances: () => uninstallAllInstances(manifestURL),
    onRemoveInstance: (id: string) => uninstallApplication(id),
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
      const checked = (event.target as HTMLInputElement).checked;
      return setInstanceLogoInDock(manifestURL, checked);
    },
    onToogleAutoSleep: (event: React.FormEvent<HTMLInputElement>) => {
      const checked = (event.target as HTMLInputElement).checked;
      return setAlwaysLoaded(manifestURL, checked);
    },
    onExtensionCheckForUpdate: checkForUpdate,
  }, dispatch), [dispatch, manifestURL, applicationName, closeSettings]);

  const onConfirmRemoveApplication = () => setRemoveState({
    ...defaultRemoveState,
    removeApplication: true,
    instancesToRemove: instances,
    removeAction: () => {
      boundActions.onRemoveAllInstances();
      setRemoveState(defaultRemoveState);
    },
  });

  const onConfirmRemoveInstance = (id: string) => setRemoveState({
    ...defaultRemoveState,
    instancesToRemove: instances.filter((i: Instance) => i.id === id),
    lastInstance: instances.count() === 1,
    removeAction: () => {
      boundActions.onRemoveInstance(id);
      setRemoveState(defaultRemoveState);
    },
  });

  const onCancelConfirmation = () => setRemoveState(defaultRemoveState);

  return (
    <div
      ref={attachAppRef}
      key={manifestURL}
      className={(classNames as any)('settings-app-item', { highlighted })}
      style={highlighted ? { ...itemStyle, ...highlightedItemStyle } : itemStyle}
    >
      {(removeState.removeApplication || removeState.instancesToRemove.count() > 0) &&
        <RemoveModalConfirmation
          applicationName={applicationName}
          instanceTypeWording={instanceWording}
          allInstancesRemoved={removeState.removeApplication || removeState.lastInstance}
          instancesToRemove={removeState.instancesToRemove}
          onContinue={removeState.removeAction}
          onCancel={onCancelConfirmation}
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
            onClick={onConfirmRemoveApplication}
          />
        </Tooltip>
      </div>

      {extensionState &&
        <div>
          <ExtensionInfos
            extensionState={extensionState}
            onCheckForUpdate={boundActions.onExtensionCheckForUpdate}
          />
        </div>
      }

      <div style={instancesContainerStyle}>
        <div style={{ marginBottom: '20px' }} >
          <ListInstances
            applications={applications}
            manifestURL={manifestURL}
            instanceTypeWording={instanceWording}
            onRemoveInstance={onConfirmRemoveInstance}
            onUnlinkPasswordManager={boundActions.onUnlinkPasswordManager}
            onConfigureInstance={boundActions.onConfigureInstance}
            instances={instances}
          />
        </div>

        <AddNewInstance
          name={applicationName}
          instanceTypeWording={instanceWording}
          onClick={boundActions.onAddNewInstance}
        />
      </div>

      <ApplicationExtensions
        extensions={extensions}
        onExtensionToggle={boundActions.onExtensionToggle}
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
          onChange={boundActions.onToggleInstanceLogoInDock}
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
            onChange={boundActions.onToogleAutoSleep}
            text={TEXT.YES_NO}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(App);

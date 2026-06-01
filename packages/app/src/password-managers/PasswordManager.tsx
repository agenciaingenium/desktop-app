import React from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { bindActionCreators } from 'redux';
import Immutable from 'immutable';
import { oc } from 'ts-optchain';

import { useGetApplicationByIdQuery } from './queries@local.gql.generated';
import RemoveLinkBanner from './components/RemoveLinkBanner';
import Banner from './components/Banner';
import Unlock from './components/Unlock';
import AttachPasswordManagerItem from './components/AttachPasswordManagerItem';
import LoadCredentials from './components/LoadCredentials';
import {
  getAccounts,
  getDisplayBanner,
  getDisplayRemoveLinkBanner,
  getLoadingCredentials,
  getPasswordManager,
  getProviderJS,
  getUnlockProcess,
} from './selectors';
import {
  UnlockStep,
  AccountsStep,
  unlock,
  accounts,
  addLink,
  displayBanner,
  displayRemoveLinkBanner,
  removeLink,
} from './duck';
import {
  PasswordManager,
} from './types';
import { getActiveApplicationId } from '../nav/selectors';

const PasswordManagerView: React.FC = () => {
  const activeApplicationId = useSelector((state: Immutable.Map<string, any>) => getActiveApplicationId(state as any)!);
  const shouldUnlock = useSelector((state: Immutable.Map<string, any>) => getUnlockProcess(state).step !== UnlockStep.NotAsked);
  const shouldAttachPasswordManagerItem = useSelector((state: Immutable.Map<string, any>) =>
    [AccountsStep.Loaded, AccountsStep.Load].includes(getAccounts(state).step)
  );
  const shouldDisplayBanner = useSelector((state: Immutable.Map<string, any>) => getDisplayBanner(state));
  const shouldDisplayRemoveLinkBanner = useSelector((state: Immutable.Map<string, any>) => getDisplayRemoveLinkBanner(state));
  const isLoadingCredentials = useSelector((state: Immutable.Map<string, any>) => getLoadingCredentials(state));
  const unlockProcess = useSelector((state: Immutable.Map<string, any>) => getUnlockProcess(state), shallowEqual);
  const passwordManager = useSelector((state: Immutable.Map<string, any>) => getPasswordManager(state), shallowEqual);
  const processAccounts = useSelector((state: Immutable.Map<string, any>) => getAccounts(state), shallowEqual);
  const provider = useSelector((state: Immutable.Map<string, any>) => getProviderJS(state), shallowEqual);

  const dispatch = useDispatch();
  const boundActions = React.useMemo(() => bindActionCreators({
    onAddPasswordManager: () => accounts({ step: AccountsStep.WaitConfiguration }),
    askUnlock: (pm: PasswordManager) => unlock({ step: UnlockStep.Ask, passwordManager: pm }),
    onUnlock: (pm: PasswordManager, payload: object, webcontentsId: number) =>
      unlock({ step: UnlockStep.Test, passwordManager: pm, payload, webcontentsId }),
    loadAccounts: (pm: PasswordManager) => accounts({ step: AccountsStep.Ask, passwordManager: pm }),
    onSelect: (pm: any, appId: string, item: any) =>
      addLink({ passwordManager: pm, applicationId: appId, passwordManagerItemId: item.id, login: item.username, avatar: item.avatar }),
    onCancel: (pm: PasswordManager) => accounts({ step: AccountsStep.Unload, passwordManager: pm }),
    onCancelUnlock: (pm: PasswordManager, exitFromAutofill: boolean) => {
      const step = exitFromAutofill ? UnlockStep.ExitFromAutofill : UnlockStep.Exit;
      return unlock({ step, passwordManager: pm });
    },
    onCloseBanner: () => displayBanner(false),
    onRemoveLink: (appId: string) => removeLink({ applicationId: appId }),
    onCloseRemoveLinkBanner: () => displayRemoveLinkBanner(false),
  }, dispatch), [dispatch]);

  const { data, loading } = useGetApplicationByIdQuery({
    variables: { applicationId: activeApplicationId },
  });

  const applicationName = oc(data).application.manifestData.name('');
  const applicationIcon = oc(data).application.manifestData.interpretedIconURL()!;
  const themeColor = oc(data).application.manifestData.theme_color()!;
  const applicationManifestURL = oc(data).application.manifestURL()!;

  const handleOnUnlock = (pm: PasswordManager, payload: object) => {
    boundActions.onUnlock(pm, payload, unlockProcess.webContentLink);
  };

  if (loading) return null;

  const exitFromAutofill = processAccounts.step !== AccountsStep.Ask;

  return (
    <div>
      {shouldDisplayRemoveLinkBanner && passwordManager &&
        <RemoveLinkBanner
          applicationName={applicationName}
          passwordManager={passwordManager}
          onRemoveLink={() => boundActions.onRemoveLink(activeApplicationId)}
          onClose={boundActions.onCloseRemoveLinkBanner}
        />
      }

      {shouldDisplayBanner &&
        <Banner
          applicationName={applicationName}
          applicationId={activeApplicationId}
          passwordManager={passwordManager}
          provider={provider}
          onAddPasswordManager={() => boundActions.onAddPasswordManager()}
          onAttachPasswordManagerItem={() => boundActions.loadAccounts(passwordManager)}
          onClose={boundActions.onCloseBanner}
        />
      }

      {shouldUnlock &&
        <Unlock
          process={unlockProcess}
          passwordManager={passwordManager}
          onUnlock={handleOnUnlock}
          onCancel={() => { boundActions.onCancelUnlock(passwordManager, exitFromAutofill); }}
          providerName={provider.name}
          applicationName={applicationName}
        />
      }

      {!shouldUnlock && shouldAttachPasswordManagerItem &&
        <AttachPasswordManagerItem
          applicationName={applicationName}
          applicationManifestURL={applicationManifestURL}
          applicationIcon={applicationIcon}
          themeColor={themeColor}
          passwordManager={passwordManager}
          process={processAccounts}
          onSelect={(item) => { boundActions.onSelect(passwordManager, activeApplicationId, item); }}
          onCancel={() => { boundActions.onCancel(passwordManager); }}
        />
      }

      {isLoadingCredentials &&
        <LoadCredentials
          applicationName={applicationName}
          applicationIcon={applicationIcon}
          themeColor={themeColor}
          providerName={provider.name}
        />
      }
    </div>
  );
};

export default PasswordManagerView;

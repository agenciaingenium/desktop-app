import { GradientType, InjectedProps as withGradientProps, withGradient } from '@getstation/theme';
import { withApollo, WithApolloClient } from '@apollo/client/react/hoc';
import * as Immutable from 'immutable';
// @ts-ignore: no declaration file
import { validate as validateEmail } from 'isemail';
import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, compose } from 'redux';
import { updateUI } from '../ui/redux-ui-compat';
import {
  MinimalApplication,
} from '../applications/graphql/withApplications';
import { isDarwin } from '../utils/process';
import { appStoreStepFinished, startOnboarding } from './duck';
import Presenter from './Presenter';

import {
  useGetDefaultApplicationsForOnboardingQuery,
  useInstallApplicationMutation,
  InstallApplicationMutationVariables,
  useOnboardingDoneMutation,
} from './queries@local.gql.generated';

import { OnboardingType } from '../ui/types';
import { search } from '../../manifests';

export interface DispatchFromProps {
  onClickLogin: typeof startOnboarding,
  onAppStoreStepFinished: typeof appStoreStepFinished,
}

export interface UIProp {
  step: number,
  emails: string[],
  loginButtonDisabled: boolean,
  loginError?: string,
  showWelcomeBack: boolean,
  onboardingSessionId: string,
  onboardingType: OnboardingType,
}

export interface UIProps {
  ui: UIProp,
  updateUI: (uiState: Object) => any
}

type InstallApplicationInput = InstallApplicationMutationVariables['input'];

export type Props =
  DispatchFromProps
  & UIProps
  & withGradientProps
  & WithApolloClient<{}>;

interface State {
  isWindowFocused: boolean,
  searchInputValue: string,
  currentSearchedApplicationsResult: MinimalApplication[] | null,
}

class OnboardingImpl extends React.PureComponent<Props, State> {
  private unsubscribeFocus: (() => void) | null = null;
  private unsubscribeBlur: (() => void) | null = null;

  constructor(props: Props) {
    super(props);

    this.state = {
      isWindowFocused: false,
      searchInputValue: '',
      currentSearchedApplicationsResult: null,
    };

    window.station.window.isFocused().then((focused) => {
      this.setState({ isWindowFocused: focused });
    });

    this.updateEmails = this.updateEmails.bind(this);
    this.handleSearchInputValue = this.handleSearchInputValue.bind(this);
    this.getApplications = this.getApplications.bind(this);
    this.handleMinimizeWindow = this.handleMinimizeWindow.bind(this);
    this.handleCloseWindow = this.handleCloseWindow.bind(this);
    this.handleExpandWindow = this.handleExpandWindow.bind(this);
  }

  componentDidMount() {
    this.unsubscribeFocus = window.station.window.onFocus(() => {
      this.setState({ isWindowFocused: true });
    });

    this.unsubscribeBlur = window.station.window.onBlur(() => {
      this.setState({ isWindowFocused: false });
    });
  }

  async componentDidUpdate(_: Props, prevState: State) {
    if (this.state.searchInputValue !== prevState.searchInputValue) {
      if (this.state.searchInputValue === '') {
        this.setState({ currentSearchedApplicationsResult: null });
      } else {
        this.updateSearchedApplications(this.state.searchInputValue);
      }
    }
  }

  async updateSearchedApplications(term: string) {
    const applications = search(term);
    this.setState({
      currentSearchedApplicationsResult: applications,
    });
  }

  componentWillUnmount() {
    if (this.unsubscribeFocus) this.unsubscribeFocus();
    if (this.unsubscribeBlur) this.unsubscribeBlur();
  }

  onFocus() { }

  onBlur() { }

  updateEmails(emails: string[]) {
    const { updateUI } = this.props;
    return updateUI({
      emails,
    });
  }

  getApplications(): MinimalApplication[] {
    const applications = this.props['applications' as keyof Props] as MinimalApplication[] | undefined;

    if (!applications) return [];

    if (this.state.searchInputValue !== '' && this.state.currentSearchedApplicationsResult) {
      return this.state.currentSearchedApplicationsResult;
    }

    return applications;
  }

  handleSearchInputValue(value: string) {
    this.setState({ searchInputValue: value });
  }

  handleCloseWindow() {
    window.station.window.close();
  }

  handleMinimizeWindow() {
    window.station.window.minimize();
  }

  handleExpandWindow() {
    window.station.window.isFullScreen().then((isFullScreen) => {
      window.station.window.setFullScreen(!isFullScreen);
    });
  }

  render() {
    const {
      onClickLogin, onAppStoreStepFinished,
      ui: { step, emails, loginButtonDisabled, loginError, showWelcomeBack },
    } = this.props;
    const { isWindowFocused, searchInputValue } = this.state;

    // Get installApplication and onboardingDone from the wrapper component
    const installApplication = this.props['installApplication' as keyof Props] as ((input: InstallApplicationInput) => Promise<void>) | undefined;
    const onboardingDone = this.props['onboardingDone' as keyof Props] as ((nbInstalledApps: number, onboardeeId?: string) => Promise<void>) | undefined;

    return (
      <Presenter
        applications={this.getApplications()}
        onClickLogin={onClickLogin}
        error={loginError}
        showWelcomeBack={showWelcomeBack}
        step={step}
        onAppStoreStepFinished={onAppStoreStepFinished}
        onboardingDone={onboardingDone!}
        emails={emails}
        onEmailsChange={this.updateEmails}
        loginButtonDisabled={loginButtonDisabled}
        privacyPoliciesLink={'https://github.com/getstation/desktop-app/wiki/FAQ#-data--privacy'}
        isWindowFocused={isWindowFocused}
        onCloseWindow={this.handleCloseWindow}
        onMinimizeWindow={this.handleMinimizeWindow}
        onExpandWindow={this.handleExpandWindow}
        isDarwin={isDarwin}
        validateEmail={validateEmail}
        searchInputValue={searchInputValue}
        handleSearchInputValue={this.handleSearchInputValue}
        installApplication={installApplication!}
      />
    );
  }
}

// Wrapper component that uses hooks for GraphQL and passes them down
const OnboardingWithHooks: React.FC<any> = (props) => {
  const { data } = useGetDefaultApplicationsForOnboardingQuery();
  const [installAppMutation] = useInstallApplicationMutation();
  const [onboardingDoneMutation] = useOnboardingDoneMutation();

  const applications = data?.applications ?? [];

  const installApplication = async (input: InstallApplicationInput): Promise<void> => {
    await installAppMutation({ variables: { input } });
  };

  const onboardingDone = async (nbInstalledApps: number, onboardeeId?: string): Promise<void> => {
    await onboardingDoneMutation({ variables: { nbInstalledApps, onboardeeId } });
  };

  return (
    <OnboardingImpl
      {...props}
      applications={applications}
      installApplication={installApplication}
      onboardingDone={onboardingDone}
    />
  );
};

const Onboarding = compose(
  connect<{}, DispatchFromProps, {}>(
    (state: Immutable.Map<string, any>) => ({
      ui: state.getIn(['ui', 'onboarding'], Immutable.Map({
        onboardingType: OnboardingType.Undefined,
        step: 0,
        emails: ['', '', ''],
        loginButtonDisabled: false,
        loginError: undefined,
        showWelcomeBack: false,
        onboardingSessionId: undefined,
      })).toJS(),
    }),
    dispatch => bindActionCreators(
      {
        onAppStoreStepFinished: appStoreStepFinished,
        updateUI: (uiState: Object) => updateUI('onboarding', uiState),
      },
      dispatch
    )
  ),
  withApollo,
  withGradient(GradientType.normal)
)(OnboardingWithHooks);

export default Onboarding;

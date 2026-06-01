import { GradientType, SlideX, theme, withGradient } from '@getstation/theme';
// @ts-ignore: no declaration file
import React from 'react';
import { MinimalApplication } from '../applications/graphql/withApplications';
import TrafficLights from '../dock/components/TrafficLights';
import { OnboardingDockIcon } from './components/OnboardingDockIcon';
import OnboardingStepAppStore from './components/OnboardingStepAppStore';

import {
  InstallApplicationMutationVariables,
  Platform,
} from './queries@local.gql.generated';

type InstallApplicationInput = InstallApplicationMutationVariables['input'];

export interface Props {
  applications: MinimalApplication[],
  themeGradient: string,
  error?: string,
  showWelcomeBack?: boolean,
  firstName?: string,
  step: number,
  emails: string[],
  loginButtonDisabled?: boolean,
  privacyPoliciesLink: string,
  onClickLogin: () => any,
  onAppStoreStepFinished: (
    appsSelectedCount: number,
  ) => void,
  onEmailsChange: (emails: string[]) => any,
  isWindowFocused: boolean,
  onCloseWindow: () => any,
  onMinimizeWindow: () => any,
  onExpandWindow: () => any,
  isDarwin: boolean,
  validateEmail: (email: string) => boolean,
  searchInputValue: string,
  handleSearchInputValue: (value: string) => any,
  installApplication: (input: InstallApplicationInput) => Promise<void>,
  onboardingDone: (nbInstalledApps: number, onboardeeId: string | undefined) => Promise<void>,
}

interface State {
  selectedApplications: (MinimalApplication & { position?: DOMRect })[],
  isLoading: boolean,
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  position: 'absolute',
  top: 0,
  left: 0,
  ...theme.mixins.size('100%'),
  zIndex: 101,
};

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  flexDirection: 'column',
  width: 490,
  height: '100%',
  backgroundColor: 'white',
};

const sectionHeaderStyle: React.CSSProperties = {
  padding: '60px 60px 0 60px',
  width: '100%',
};

const trafficLightsStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
};

const onboardingDockStyle: React.CSSProperties = {
  width: 60,
  height: '100%',
  backgroundColor: 'rgba(255, 255, 255, .8)',
  padding: '60px 15px 20px',
  transition: '300ms ease-in-out',
};

const hideOnboardingDockStyle: React.CSSProperties = {
  width: 0,
  padding: 0,
};

class Presenter extends React.PureComponent<Props, State> {

  static defaultProps = {
    step: 0,
    loginButtonDisabled: false,
  };

  constructor(props: Props) {
    super(props);

    this.state = {
      selectedApplications: [],
      isLoading: false,
    };

    this.handleApplicationSelect = this.handleApplicationSelect.bind(this);
    this.handleSubmitAppStore = this.handleSubmitAppStore.bind(this);
  }

  handleApplicationSelect(
    application: MinimalApplication,
    iconRef: any,
  ) {
    const { selectedApplications } = this.state;

    const { id } = application;

    if (selectedApplications.find((app: MinimalApplication) => app.id === id)) {
      this.setState({
        selectedApplications: Array.from(selectedApplications).filter((app: any) => app.id !== id),
      });
      return;
    }

    if (selectedApplications.length > 14) return;

    const newSelectedApplications = Array.from(selectedApplications);
    newSelectedApplications.push({ ...application, position: iconRef.getBoundingClientRect() });
    this.setState({ selectedApplications: newSelectedApplications });
  }

  async handleSubmitAppStore() {
    const {
      installApplication,
      onboardingDone,
    } = this.props;
    this.setState({ isLoading: true });

    const selectedApps = this.state.selectedApplications.map(app => ({
      id: undefined,
      application: app,
      configuration: {},
    }));

    const apps = selectedApps;

    for (const app of apps) {
      await installApplication({
        manifestURL: app.application.bxAppManifestURL,
        context: {
          id: app.application.id,
          platform: Platform.PlatformAppstore,
          onboardeeApplicationAssignment: undefined,
        },
        configuration: app.configuration,
      });
    }

    await onboardingDone(apps.length, undefined);
  }

  renderDockIcons = () => {
    const { selectedApplications } = this.state;

    const dockStyle = selectedApplications.length === 0
      ? { ...onboardingDockStyle, ...hideOnboardingDockStyle }
      : onboardingDockStyle;

    return (
      <div style={dockStyle}>
        {selectedApplications.map((app, index: number) =>
          <OnboardingDockIcon
            key={app.id}
            application={app}
            indexPosition={index}
            onRemove={this.handleApplicationSelect}
          />
        )}
      </div>
    );
  }

  render() {
    const {
      applications, step,
      isWindowFocused, onCloseWindow, onMinimizeWindow,
      onExpandWindow, isDarwin, searchInputValue, handleSearchInputValue,
      themeGradient,
    } = this.props;

    const { selectedApplications, isLoading } = this.state;

    const illustrationStyle: React.CSSProperties = {
      flex: 1,
      backgroundImage: `url("static/illustrations/illustration--onboarding@2x.png"), ${themeGradient}`,
      backgroundSize: 'contain',
      backgroundRepeat: 'no-repeat',
    };

    return (
      <div style={containerStyle}>
        <div id="portal-powered-by-station" />
        {isDarwin &&
          <div style={trafficLightsStyle}>
            <TrafficLights
              focused={isWindowFocused}
              handleClose={onCloseWindow}
              handleMinimize={onMinimizeWindow}
              handleExpand={onExpandWindow}
              allHover={true}
            />
          </div>
        }

        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <img src="static/logos/station-logo-full-black.svg" alt="" />
          </div>

          <SlideX step={step}>
            <OnboardingStepAppStore
              onHandleApplicationSelect={this.handleApplicationSelect}
              onValidSubmit={this.handleSubmitAppStore}
              applications={applications.slice(0, 10)}
              selectedApplications={selectedApplications}
              searchInputValue={searchInputValue}
              handleSearchInputValue={handleSearchInputValue}
              isLoading={isLoading}
            />
          </SlideX>
        </div>

        <div style={illustrationStyle}>
          {this.renderDockIcons()}
        </div>
      </div>
    );
  }
}

export default withGradient(GradientType.normal)(Presenter);
import * as React from 'react';
import { BxAppManifest } from '../../manifest-provider/bxAppManifest';
import ChooseIdentityForm from './components/ChooseIdentityForm';
import ChooseCommonForm from './components/ChooseCommonForm';
import { MultiInstanceConfigPreset as Preset } from '../../manifest-provider/types';
import NormalFlowForm from './components/NormalFlowForm';
import { getPresets } from '../../manifest-provider/helpers';

const requestGoogleSignin = () => window.bxApi.identities.requestLogin('google');

const {
  Undefined: UndefinedPreset,
  Subdomain: SubdomainPreset,
  GoogleAccount: GoogleAccountPreset,
  OnPremise: OnPremisePreset,
} = Preset;

const isOnlyOnPremise = (presets: Preset[]) => presets.length === 1 && presets[0] === OnPremisePreset;
const interpretedIconUrl = (manifest: BxAppManifest) => manifest.icons?.[0]?.src;

const getHostname = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return '';
  }
};

export interface Props {
  manifestURL: string,
  applicationId: string,
}

export interface State {
  manifest?: BxAppManifest,
  selectedPreset: Preset,
  hoveredRemoveCTA: boolean,
}

export default class MultiInstanceConfigurator extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = { selectedPreset: UndefinedPreset, hoveredRemoveCTA: false };
  }

  submitSubdomainForm = (subdomain: string) => {
    window.bxApi.applications.setConfigData(this.props.applicationId, { subdomain });
  }

  submitIdentityForm = (identityId: string) => {
    window.bxApi.applications.setConfigData(this.props.applicationId, { identityId });
  }

  submitOnPremiseForm = (customURL: string) => {
    window.bxApi.applications.setConfigData(this.props.applicationId, { customURL });
  }

  submitNormalForm = () => {
    window.bxApi.applications.setConfigData(this.props.applicationId, {});
  }

  removeApplication = () => {
    window.bxApi.applications.uninstall(this.props.applicationId);
  }

  componentDidMount() {
    const { manifestURL } = this.props;
    window.bxApi.manifest.getManifest(manifestURL).then(({ body }) => {
      const manifest = body;
      const presets = this.getPresets(manifest);
      const selectedPreset = isOnlyOnPremise(presets) ? UndefinedPreset : presets[0];
      this.setState({
        manifest,
        selectedPreset: selectedPreset || UndefinedPreset,
      });
    });
  }

  getAppHostname = () => {
    return getHostname(this.state.manifest!.start_url!);
  }

  getCommonFormHelpMessage = () => {
    const appName = this.state.manifest!.name!;
    const instanceWording = this.state.manifest!.bx_multi_instance_config!.instance_wording! || 'instance';
    return `Enter your ${instanceWording}'s ${appName} domain`;
  }

  setDefaultSelectedPreset = (presets: Preset[]) => {
    return this.setState({ selectedPreset: presets[0] || UndefinedPreset });
  }

  setNextSelectedPreset = () => {
    const { selectedPreset } = this.state;
    const presets = this.getPresets();

    if (isOnlyOnPremise(presets) && selectedPreset === UndefinedPreset) {
      return this.setState({ selectedPreset: OnPremisePreset });
    }
    if (isOnlyOnPremise(presets) && selectedPreset === OnPremisePreset) {
      return this.setState({ selectedPreset: UndefinedPreset });
    }

    if (selectedPreset === UndefinedPreset) {
      return this.setDefaultSelectedPreset(presets);
    }

    const presetIndex = presets.findIndex(p => p === selectedPreset);
    const nextPresetIndex = presetIndex + 1;

    if (presetIndex === -1) {
      return;
    } else if (nextPresetIndex === presets.length) {
      return this.setState({ selectedPreset: presets[0] });
    } else if (presets[nextPresetIndex]) {
      return this.setState({ selectedPreset: presets[nextPresetIndex] });
    }

    return this.setDefaultSelectedPreset(presets);
  }

  renderIdentityForm() {
    const { manifest } = this.state;
    return (
      <ChooseIdentityForm
        name={manifest!.name!}
        onRequestSignin={requestGoogleSignin}
        instanceTypeWording={manifest!.bx_multi_instance_config!.instance_wording}
        onAccountChosen={this.submitIdentityForm}
      />
    );
  }

  renderSubdomainForm() {
    const { manifest } = this.state;
    const presets = this.getPresets();
    return (
      <ChooseCommonForm
        help={manifest!.bx_multi_instance_config!.subdomain_ui_help}
        domainSuffix={manifest!.bx_multi_instance_config!.subdomain_ui_suffix!}
        onSubmit={this.submitSubdomainForm}
        navigateWording="I have a self-hosted instance"
        navigateHint="Choose this if your company uses a different kind of URL for this app"
        withNavigationLink={presets.length > 1}
        onClickNavigate={this.setNextSelectedPreset}
      />
    );
  }

  renderOnPremiseForm({ normalFlow }: { normalFlow?: boolean } = {}) {
    const withNavigationLink = normalFlow || this.getPresets().length > 1;
    const navigateWording = normalFlow ? `I want to use ${this.getAppHostname()}` : 'I have a subdomain';
    const navigateHint = normalFlow
      ? 'Choose this if you want to use the original app'
      : 'Choose this if your company uses a subdomain for this app';

    return (
      <ChooseCommonForm
        largeInput={true}
        help={this.getCommonFormHelpMessage()}
        placeholder="https://app.mycompany.com"
        domainSuffix=""
        onSubmit={this.submitOnPremiseForm}
        navigateWording={navigateWording}
        navigateHint={navigateHint}
        withNavigationLink={withNavigationLink}
        onClickNavigate={this.setNextSelectedPreset}
      />
    );
  }

  renderNormalFlowForm() {
    return (
      <NormalFlowForm
        appHostname={this.getAppHostname()}
        onClickUseSelfInstance={this.setNextSelectedPreset}
        onClickGoToApp={this.submitNormalForm}
        selfInstanceHint="Choose this if your company uses a different kind of URL for this app"
      />
    );
  }

  chooseForm() {
    const { selectedPreset } = this.state;
    const presets = this.getPresets();

    if (isOnlyOnPremise(presets) && selectedPreset === UndefinedPreset) { // normal flow
      return this.renderNormalFlowForm();
    } else if (isOnlyOnPremise(presets) && selectedPreset === OnPremisePreset) { // on-premise/normal flows
      return this.renderOnPremiseForm({ normalFlow: true });
    }

    switch (selectedPreset) {
      case GoogleAccountPreset: return this.renderIdentityForm(); // google-account
      case SubdomainPreset: return this.renderSubdomainForm(); // subdomain
      case OnPremisePreset: return this.renderOnPremiseForm(); // on-premise/subdomain flows
      default: {
        console.error(new Error('No valid form found'), presets, selectedPreset);
        return null;
      }
    }
  }

  render() {
    const { manifest } = this.state;
    const { hoveredRemoveCTA } = this.state;

    if (!manifest) return null;

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(120deg, #2B91BA, #3794C2, #4B99CF, #629FDD)',
        padding: 10,
      }}>
        <div style={{
          display: 'flex',
          width: '100%',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: 3,
          height: '100%',
          color: 'white',
          fontSize: 14,
          position: 'relative' as const,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: 80,
            height: 80,
            marginBottom: 30,
            borderRadius: 100,
            backgroundColor: 'rgba(255, 255, 255, .3)',
            position: 'relative' as const,
          }}>
            <img style={{ width: 60, height: 60 }} src={interpretedIconUrl(manifest)} width={60} height={60} alt="Icon" />
          </div>
          <div style={{ width: 260, textAlign: 'center' as const }}>
            {this.chooseForm()}

            <p style={{ marginLeft: 28, bottom: 40, position: 'absolute' as const }}>
              I don't need this app,
              <a
                style={{
                  fontStyle: 'italic',
                  paddingLeft: 3,
                  cursor: 'pointer',
                  textDecoration: hoveredRemoveCTA ? 'underline' : 'none',
                }}
                onClick={this.removeApplication}
                onMouseEnter={() => this.setState({ hoveredRemoveCTA: true })}
                onMouseLeave={() => this.setState({ hoveredRemoveCTA: false })}
              >
                remove it
              </a>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  private getPresets = (manifest: BxAppManifest | undefined = this.state.manifest): Preset[] => {
    return getPresets(manifest);
  }
}
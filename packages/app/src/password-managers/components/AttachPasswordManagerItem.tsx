import { Chooser, Input, Modal, theme } from '@getstation/theme';
// @ts-ignore
import Fuse from 'fuse.js';
// @ts-ignore: no declaration file
import isBlank from 'is-blank';
import * as React from 'react';
import { AccountsAction, AccountsStep } from '../duck';
import { Account, PasswordManager } from '../types';

export interface Props {
  themeColor: string,
  applicationName: string,
  applicationManifestURL: string,
  applicationIcon: string,
  passwordManager: PasswordManager,
  process: AccountsAction,
  onSelect: (item: any) => any,
  onCancel: () => any,
}

export interface State {
  defaultQuery: string,
  query: string,
  accounts: Account[],
}

const inputStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  boxSizing: 'border-box',
  marginTop: -10,
  padding: '0 20px 10px',
  backgroundColor: theme.colors.gray.light,
  zIndex: 1,
};

const modalBodyStyle: React.CSSProperties = {
  padding: '5px 0 !important',
};

const bodyStyle: React.CSSProperties = {
  marginTop: 50,
  height: 180,
};

const noResultsStyle: React.CSSProperties = {
  ...theme.mixins.flexbox.containerCenter,
  height: '100%',
  boxSizing: 'border-box',
  padding: 60,
  ...theme.fontMixin(14, 500),
  lineHeight: '20px',
  color: theme.colors.gray.middle,
  textAlign: 'center',
};

const chooserStyle: React.CSSProperties = {
  height: '100%',
  padding: '10px 20px 0',
  overflow: 'auto',
  boxSizing: 'border-box',
};

export default class AttachPasswordManagerItem extends React.PureComponent<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {
      defaultQuery: '',
      query: '',
      accounts: [],
    };

    this.handleInputChange = this.handleInputChange.bind(this);
    this.onCancel = this.onCancel.bind(this);
    this.onSelect = this.onSelect.bind(this);
  }

  componentDidUpdate(prevProps: Readonly<Props>) {
    const { applicationName, process: { step, data } } = this.props;

    if (!(prevProps.process.step === AccountsStep.Load && step === AccountsStep.Loaded)) return;

    if (data) {
      const defaultQuery = applicationName;
      this.setState({ defaultQuery, accounts: data });
      this.search(defaultQuery);
    }
  }

  handleInputChange(event: any) {
    const query = event.target.value;
    this.setState({ query });
    this.search(query);
  }

  search(query: string) {
    const { process: { data } } = this.props;
    if (!data) return;

    const { defaultQuery } = this.state;
    const fuse = new Fuse(data, {
      keys: ['title', 'description'],
      shouldSort: true,
      threshold: 0.6,
    });

    if (isBlank(query)) {
      this.setState({ accounts: fuse.search(defaultQuery) });
    } else {
      this.setState({ accounts: fuse.search(query) });
    }
  }

  onCancel = () => {
    const { onCancel } = this.props;
    onCancel();
  }

  onSelect = (account: Account) => {
    const { onSelect } = this.props;
    onSelect(account);
  }

  render() {
    const { themeColor, process, applicationName, applicationIcon, passwordManager: { providerName } } = this.props;
    const { query, accounts } = this.state;

    return (
      <Modal
        title={`Login with ${providerName}`}
        description={`Select your account to login to ${applicationName}`}
        onCancel={this.onCancel}
        applicationIcon={applicationIcon}
        themeColor={themeColor}
        classNameModalBody={modalBodyStyle as any}
        isLoading={process.step === AccountsStep.Load}
      >
        <div className="attach-pm-body" style={bodyStyle}>
          <div style={inputStyle}>
            <Input
              autoFocus={true}
              type="search"
              placeholder="Search among your logins…"
              value={query}
              onChange={(e: any) => this.handleInputChange(e)}
            />
          </div>

          {accounts.length === 0 ?
            <div style={noResultsStyle}>
              😢 <br />
              Sorry, we couldn't find any accounts for "{query}"
            </div>
            :
            <Chooser
              // @ts-ignore
              style={chooserStyle as any}
              items={accounts.map((account: Account) => ({ title: account.title, description: account.username, value: account }))}
              onSelect={this.onSelect as any}
            />
          }
        </div>
      </Modal>
    );
  }
}
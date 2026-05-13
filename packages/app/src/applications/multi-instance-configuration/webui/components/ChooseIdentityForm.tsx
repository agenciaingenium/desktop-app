import * as React from 'react';

const STYLE = {
  help: {
    marginBottom: 17,
    fontSize: 13,
    fontWeight: 600,
  } as React.CSSProperties,
  accountContainer: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
  },
  account: {
    width: 220,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40,
    marginBottom: 2,
    padding: '12px 8px',
    fontSize: 11,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transition: 'background-color 100ms ease-out',
    cursor: 'pointer',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  } as React.CSSProperties,
  accountFirstOfType: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  } as React.CSSProperties,
  accountLastOfType: {
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  } as React.CSSProperties,
  accountHover: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  } as React.CSSProperties,
  accountDetail: {
    display: 'flex',
    flex: 1,
    width: 0,
    marginRight: 2,
  } as React.CSSProperties,
  accountEmail: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } as React.CSSProperties,
  accountImage: {
    flexShrink: 0,
    width: 16,
    height: 16,
    marginRight: 10,
    border: '2px solid white',
    borderRadius: '100%',
  } as React.CSSProperties,
  subContainer: {
    marginTop: 20,
  } as React.CSSProperties,
  primaryButton: {
    width: '100%',
    padding: '10px 12px',
    border: 0,
    borderRadius: 4,
    cursor: 'pointer',
    color: '#fff',
    fontWeight: 600,
    background: 'linear-gradient(120deg, #2B91BA, #4B99CF)',
  } as React.CSSProperties,
};

export interface Props {
  help?: string,
  instanceTypeWording?: string,
  name: string,
  onRequestSignin: () => void,
  onAccountChosen: (accountId: string) => void,
}

interface State {
  identities: {
    type: string
    id: string,
    email: string,
    imageURL: string,
  }[]
}

export default class ChooseIdentityForm extends React.PureComponent<Props, State> {
  static defaultProps = {
    help: 'Choose an account',
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      identities: [],
    };
  }

  onClickAccount = (accountId: string) => {
    this.props.onAccountChosen(accountId);
  }

  onClickRequestSignin = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    this.props.onRequestSignin();
  }

  onIdentitiesChanged = (identities: State['identities'] | undefined) => {
    this.setState({
      identities: Array.isArray(identities) ? identities : [],
    });
  }

  componentDidMount() {
    window.bxApi.identities.addIdentitiesChangeListener(this.onIdentitiesChanged);
  }

  componentWillUnmount() {
    window.bxApi.identities.removeIdentitiesChangeListener(this.onIdentitiesChanged);
  }

  render() {
    const { instanceTypeWording, name, help } = this.props;
    const identities = Array.isArray(this.state.identities) ? this.state.identities : [];

    return (
      <div>
        <div style={STYLE.help}>
          {help}
        </div>
        <ul style={STYLE.accountContainer}>
          {identities.map((account, index) =>
            <li
              key={account.id}
              style={{
                ...STYLE.account,
                ...(index === 0 ? STYLE.accountFirstOfType : null),
                ...(index === identities.length - 1 ? STYLE.accountLastOfType : null),
              }}
              onClick={() => this.onClickAccount(account.id)}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, STYLE.accountHover)}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, { backgroundColor: STYLE.account.backgroundColor })}
            >
              <div style={STYLE.accountDetail}>
                <img
                  style={STYLE.accountImage}
                  src={account.imageURL}
                  alt={account.email}
                />
                <span style={STYLE.accountEmail}>{account.email}</span>
              </div>
            </li>
          )}

          <div style={STYLE.subContainer}>
            <button style={STYLE.primaryButton} onClick={this.onClickRequestSignin}>
              Add a new {instanceTypeWording === 'instance' ? `instance of ${name}` : instanceTypeWording}
            </button>
          </div>
        </ul>
      </div>
    );
  }
}
import * as React from 'react';

const isBlank = require('is-blank') as (v: any) => boolean;

const STYLE = {
  help: {
    marginBottom: 17,
    fontSize: 13,
    fontWeight: 600,
  } as React.CSSProperties,
  input: {
    flexGrow: 1,
    paddingBottom: 5,
    color: 'white',
    backgroundColor: 'transparent',
    border: 0,
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
  } as React.CSSProperties,
  largeInput: {
    width: 220,
  } as React.CSSProperties,
  subContainer: {
    marginTop: 20,
  } as React.CSSProperties,
  navigationLink: {
    marginTop: 20,
    cursor: 'pointer',
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
  placeholder?: string,
  domainSuffix: string,
  help?: string,
  onSubmit: (subdomain: string) => void,
  withNavigationLink?: boolean,
  onClickNavigate?: () => void,
  navigateWording?: string,
  navigateHint?: string,
  largeInput?: boolean,
}

interface State {
  subdomainValue: string,
}

export default class ChooseCommonForm extends React.PureComponent<Props, State> {

  static defaultProps = {
    help: 'Enter your subdomain',
  };

  textInput: React.RefObject<HTMLInputElement>;

  constructor(props: Props) {
    super(props);
    this.textInput = React.createRef<HTMLInputElement>();
    this.state = {
      subdomainValue: '',
    };
  }

  onInputChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    this.setState({ subdomainValue: event.target.value })

  onFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isBlank(this.state.subdomainValue)) {
      this.props.onSubmit(this.state.subdomainValue);
    }
  }

  componentDidMount() {
    // focus on the input when mounting
    if (this.textInput.current) {
      this.textInput.current.focus();
    }
  }

  render() {
    return (
      <div>
        <div style={STYLE.help}>
          {this.props.help}
        </div>
        <form onSubmit={this.onFormSubmit}>
          <input
            tabIndex={-1}
            style={{
              ...STYLE.input,
              ...(this.props.largeInput ? STYLE.largeInput : null),
            }}
            type="text"
            autoFocus={true}
            placeholder={this.props.placeholder}
            value={this.state.subdomainValue}
            onChange={this.onInputChange}
            ref={this.textInput}
          />
          <span>
            {this.props.domainSuffix}
          </span>
          {this.props.withNavigationLink &&
            <div
              title={this.props.navigateHint}
              style={STYLE.navigationLink}
              onClick={this.props.onClickNavigate}
            >
              {`👉${this.props.navigateWording}`}
            </div>
          }

          <div style={STYLE.subContainer}>
            <button style={STYLE.primaryButton} type="submit">
              Let's go!
            </button>
          </div>
        </form>
      </div>
    );
  }
}

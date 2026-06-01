import React from 'react';

export interface Props {
  value: string,
  onValueChange: (value: string) => void,
  onArrowDown: () => void,
  onArrowUp: () => void,
  onTab: () => void,
  onShiftTab: () => void,
  onEnter: (modifier: { altKey: boolean}) => void,
  onEscape: () => void,
  onContextMenu: (e: React.MouseEvent) => void,
  onClick: (e: React.MouseEvent) => void,
  refBangInput: (ref: BangInput | null) => void,
  shortcut?: string,
}

export default class BangInput extends React.PureComponent<Props> {

  static defaultProps = {
    onClick: () => {},
    onContextMenu: () => {},
  };

  private inputEl!: HTMLInputElement | null;

  constructor(props: Props) {
    super(props);
    this.setRef = this.setRef.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleValueChange = this.handleValueChange.bind(this);
    this.focus = this.focus.bind(this);
  }

  setRef(ref: HTMLInputElement | null) {
    this.inputEl = ref;
  }

  focus() {
    if (this.inputEl) this.inputEl.focus();
  }

  selectAll() {
    const { value } = this.props;
    if (!value || value.length === 0) return;

    if (this.inputEl) this.inputEl.setSelectionRange(0, value.length);
  }

  blur() {
    if (this.inputEl) this.inputEl.blur();
  }

  handleTabDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey) return;
    if (e.shiftKey) {
      this.props.onShiftTab();
    } else {
      this.props.onTab();
    }
  }

  handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case 'Tab': {
        e.preventDefault();
        this.handleTabDown(e);
        break;
      }
      case 'ArrowDown': {
        e.preventDefault();
        this.props.onArrowDown();
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        this.props.onArrowUp();
        break;
      }
      case 'Enter': {
        e.preventDefault();
        break;
      }
      case 'Escape': {
        e.preventDefault();
        this.props.onEscape();
        break;
      }
      default:
        return;
    }
  }

  handleKeyUp(e: React.KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case 'Enter': {
        e.preventDefault();
        this.props.onEnter({
          altKey: e.getModifierState('Alt'),
        });
        break;
      }
      default:
        return;
    }
  }

  handleValueChange(e: React.ChangeEvent<HTMLInputElement>) {
    this.props.onValueChange(e.target.value);
  }

  componentDidMount() {
    this.props.refBangInput(this);
  }

  render() {
    const { value, onClick, onContextMenu, shortcut } = this.props;

    const navigationIconStyle: React.CSSProperties = {
      marginRight: 4,
      padding: '2px 4px',
      background: 'rgba(255, 255, 255, .2)',
      borderRadius: 2,
      fontSize: 10,
    };

    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: 52,
          cursor: 'text',
          padding: 20,
          borderBottom: '2px solid rgba(255,255,255,0.1)',
        }}
        onClick={onClick}
        onContextMenu={onContextMenu}
      >
        <label style={{ cursor: 'inherit', flex: 1 }}>
          <input
            className="bang-input mousetrap"
            placeholder="Jump to..."
            ref={this.setRef}
            type="text"
            value={value}
            onChange={this.handleValueChange}
            onKeyDown={this.handleKeyDown}
            onKeyUp={this.handleKeyUp}
          />
        </label>

        { shortcut &&
          <div style={{ marginLeft: 5, fontSize: 10, color: 'rgba(255, 255, 255, .6)' }}>
            <span style={navigationIconStyle}>{shortcut}</span>
            Open
          </div>
        }
      </div>
    );
  }
}
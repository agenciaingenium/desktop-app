import { Button, IconSymbol, Style, Switcher, theme, Tooltip, ButtonIcon, Size } from '@getstation/theme';
import * as React from 'react';

export enum ListActionType {
  BUTTON, BUTTON_ICON, SWITCHER,
}

export type ListItemActionButtonIcon = {
  id: string,
  type: ListActionType.BUTTON_ICON,
  tooltip?: string,
  text?: string,
  symbolId: IconSymbol,
  handleAction: () => any,
};

export type ListItemActionButton = {
  id: string,
  type: ListActionType.BUTTON,
  tooltip?: string,
  text: string,
  btnStyle?: Style,
  handleAction: () => any,
};

export type ListItemActionSwitcher = {
  id: string,
  type: ListActionType.SWITCHER,
  checked: boolean,
  handleAction: () => any,
};

export type ListItemAction = ListItemActionButton | ListItemActionButtonIcon | ListItemActionSwitcher;

export type ListItemType = {
  id: string,
  imageURL?: string,
  name: string,
  onClick?: () => void,
  leftActions?: ListItemAction[],
  rightActions?: ListItemAction[],
};

type DefaultProps = {
  iconSize: number,
};

type Props = DefaultProps & {
  item: ListItemType,
};

const itemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  marginBottom: 10,
};

const actionsStyle: React.CSSProperties = {
  width: '100%',
};

export default class ListItem extends React.PureComponent<Props, {}> {
  static defaultProps: DefaultProps = {
    iconSize: 20,
  };

  getItemContentStyle(): React.CSSProperties {
    const { item } = this.props;
    const leftActions = item.leftActions || [];
    const rightActions = item.rightActions || [];
    const hasActions = Boolean(leftActions.length || rightActions.length);
    return {
      display: 'flex',
      flex: 1,
      alignItems: 'center',
      minWidth: hasActions ? '300px' : '0px',
      maxWidth: '300px',
      width: '80%',
    };
  }

  getItemImgStyle(): React.CSSProperties {
    const { iconSize } = this.props;
    return {
      flexShrink: 0,
      ...theme.mixins.size(iconSize),
      marginRight: 5,
      display: 'inline-block',
      verticalAlign: 'middle',
      borderRadius: 100,
      border: '2px solid white',
    };
  }

  getItemBodyStyle(): React.CSSProperties {
    const { item } = this.props;
    return {
      textDecoration: item.onClick ? 'underline' : 'inherit',
      cursor: item.onClick ? 'pointer' : 'inherit',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    };
  }

  renderButtonIcon(action: ListItemActionButtonIcon) {
    const buttonIcon = (
      <ButtonIcon
        key={action.id}
        symbolId={action.symbolId}
        btnSize={Size.XXSMALL}
        btnStyle={Style.SECONDARY}
        onClick={action.handleAction}
        text={action.text}
      />
    );
    if (action.tooltip) {
      return (
        <Tooltip key={action.id} tooltip={action.tooltip} offset="-2, 12" placement="right">
          {buttonIcon}
        </Tooltip>
      );
    }
    return buttonIcon;
  }

  renderButton(action: ListItemActionButton) {
    const btnStyle = action.btnStyle || Style.SECONDARY;
    const buttonIcon = (
      <Button btnStyle={btnStyle} key={action.id} btnSize={Size.XXSMALL} onClick={action.handleAction}>
        {action.text}
      </Button>
    );
    if (action.tooltip) {
      return (
        <Tooltip key={action.id} tooltip={action.tooltip} placement={'top'} offset="0, 4">
          {buttonIcon}
        </Tooltip>
      );
    }
    return buttonIcon;
  }

  renderSwitcher(action: ListItemActionSwitcher) {
    return (
      <Switcher key={action.id} checked={action.checked} onChange={action.handleAction} />
    );
  }

  renderActions(actions: undefined | ListItemAction[], justifyContent: 'flex-start' | 'flex-end') {
    if (actions) {
      return (
        <div style={actionsStyle}>
          <div style={{ display: 'flex', justifyContent }}>
            {
              actions.map((action: ListItemAction) => {
                switch (action.type) {
                  case ListActionType.BUTTON_ICON:
                    return this.renderButtonIcon(action);
                  case ListActionType.SWITCHER:
                    return this.renderSwitcher(action);
                  case ListActionType.BUTTON:
                    return this.renderButton(action);
                  default:
                    return null;
                }
              })
            }
          </div>
        </div>
      );
    }
    return null;
  }

  render() {
    const { item } = this.props;

    return (
      <li style={itemStyle}>
        <div style={this.getItemContentStyle()}>
          {item.imageURL && <img style={this.getItemImgStyle()} src={item.imageURL} alt={item.name} />}
          <span onClick={item.onClick} style={this.getItemBodyStyle()}>{item.name}</span>
        </div>

        {this.renderActions(item.leftActions, 'flex-start')}
        {this.renderActions(item.rightActions, 'flex-end')}
      </li>
    );
  }
}
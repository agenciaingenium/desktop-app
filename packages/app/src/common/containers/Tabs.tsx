import React from 'react';
import { Props as TabProps } from './Tab';

type TabElement = React.ReactElement<TabProps>;

export interface Props {
  children: TabElement | TabElement[],
  activeTabTitle: string,
  setActiveTab: (title: string) => void,
}

const titlesContainerStyle: React.CSSProperties = {
  width: 130,
};

const titlesStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
};

const panelStyle: React.CSSProperties = {
  flex: 1,
  height: '100%',
  marginLeft: 20,
  padding: '0 20px',
  borderLeft: '1px solid rgba(255, 255, 255, .20)',
  overflowY: 'auto',
};

/*
** This component just render tabs with active tab content, it used by SettingOverlay.
*/
export default class Tabs extends React.PureComponent<Props, {}> {

  renderChildren() {
    return React.Children.map(this.props.children, (child: TabElement) => {
      return (
        <div onClick={() => this.props.setActiveTab(child.props.title)}>
          { React.cloneElement(child, {
            isActive: child.props.title === this.props.activeTabTitle,
          })}
        </div>
      );
    });
  }

  renderActiveTabContent() {
    const { children, activeTabTitle } = this.props;
    if (!children) return null;

    const childrenArray = React.Children.toArray(children) as TabElement[];
    const activeTab = childrenArray.find((c: TabElement) => c.props.title === activeTabTitle);
    if (!activeTab) return null;
    return activeTab.props.children();
  }

  render() {
    return (
      [
        (
          <div key="tabs-title" style={titlesContainerStyle}>
            <ul style={titlesStyle}>
              {this.renderChildren()}
            </ul>
          </div>
        ),
        (
          <div key="tabs-panel" style={panelStyle}>
            {this.renderActiveTabContent()}
          </div>
        ),
      ]
    );
  }
}
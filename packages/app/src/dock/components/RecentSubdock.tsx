import { GradientType, theme, withGradient } from '@getstation/theme';
import * as React from 'react';
import { findDOMNode } from 'react-dom';
import {
  SearchPaneItemSelectedVia,
  cyclingStep as bangCyclingStep,
  SearchPaneItemsListCycleDirection,
  SearchPaneItemsListCycleVia,
  SearchPaneItemSelectedItem,
} from '../../bang/duck';
import BangItem from '../../bang/components/BangItem';
import BangBottom from '../../bang/components/BangBottom';
import { ActivityEntry } from '../../activity/queries@local.gql.generated';
import { getId, findItemById } from '../../bang/helpers/utils';

const throttle = require('lodash.throttle');

export interface Props {
  themeGradient: string,
  onDidMount: () => void,
  onWillUnmount: () => void,
  onMouseEnter: () => void,
  onMouseLeave: () => void,
  onEsc: () => void,
  recentApplications: ActivityEntry[],
  highlightedItemId?: string,
  cyclingStep: typeof bangCyclingStep,
  isCycling: boolean,
  selectItem: (item: ActivityEntry, via: SearchPaneItemSelectedVia, position: number) => void,
  setHighlightedItemId: (bxResourceId?: string) => void,
}

const recentSubdockTitleStyle: React.CSSProperties = {
  padding: 15,
  color: 'rgba(255, 255, 255, .4)',
  backgroundColor: 'rgba(255, 255, 255, .1)',
  ...theme.fontMixin(9, 600),
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const navigationIconStyle: React.CSSProperties = {
  marginRight: 4,
  padding: '2px 4px',
  background: 'rgba(255, 255, 255, .1)',
  borderRadius: 2,
};

class RecentSubdock extends React.PureComponent<Props> {
  private highlightedItemComponent: BangItem | null;

  constructor(props: Props) {
    super(props);

    if (!props.isCycling && props.recentApplications.length > 0) {
      props.setHighlightedItemId(getId(props.recentApplications[0]));
    }

    this.componentDidUpdate = throttle(this.componentDidUpdate, 100, { leading: false });
  }

  getHighlightedItem = () => findItemById(this.props.highlightedItemId!, this.props.recentApplications);

  previousHighlightedItemIndex(via: SearchPaneItemsListCycleVia) {
    const withCycling = via !== 'keyboard-arrow';
    const item = this.getHighlightedItem();
    const newIndex = this.props.recentApplications.indexOf(item!) - 1;

    if (newIndex < 0) {
      return withCycling ? this.props.recentApplications.length - 1 : null;
    }
    return newIndex;
  }

  nextHighlightedItemIndex(via: SearchPaneItemsListCycleVia) {
    const withCycling = via !== 'keyboard-arrow';
    const item = this.getHighlightedItem();
    const newIndex = this.props.recentApplications.indexOf(item!) + 1;

    if (newIndex >= this.props.recentApplications.length) {
      return withCycling ? 0 : null;
    }
    return newIndex;
  }

  cyclingStep = (index: number | null, direction: SearchPaneItemsListCycleDirection, via: SearchPaneItemsListCycleVia) => {
    if (index === null) return;
    const items = this.props.recentApplications;
    return this.props.cyclingStep(items[index], index, direction, 'subdock', via);
  }

  componentDidMount() {
    this.handleKeyboardShortcuts();
    this.props.onDidMount();
  }

  componentDidUpdate() {
    const item = findDOMNode(this.highlightedItemComponent);
    if (item) {
      item.scrollIntoView({ behavior: 'smooth' });
    }
  }

  componentWillUnmount() {
    Mousetrap.unbind(['enter', 'tab', 'esc', 'ctrl+esc', 'up', 'down', 'shift+tab']);
    this.props.onWillUnmount();
  }

  handleKeyboardShortcuts() {
    Mousetrap.bind(['enter'], (e) => {
      const { isCycling, recentApplications, highlightedItemId } = this.props;
      e.preventDefault();

      if (isCycling) return;

      const index = recentApplications.findIndex(app => getId(app) === highlightedItemId);

      if (index > -1) {
        const application = recentApplications[index];
        const altKey = e.getModifierState('Alt');
        switch (altKey) {
          case false: {
            this.props.selectItem(application, 'keyboard-enter', index);
            break;
          }
        }
      }
    });
    Mousetrap.bind(['ctrl+esc', 'esc'], (e) => {
      e.preventDefault();

      this.props.onEsc();
    });
    Mousetrap.bind(['tab', 'down'], (e) => {
      e.preventDefault();
      if (this.props.isCycling) return;

      const via = e.key === 'Tab' ? 'keyboard-tab' : 'keyboard-arrow';
      this.cyclingStep(this.nextHighlightedItemIndex(via), 'down', via);
    });
    Mousetrap.bind(['shift+tab', 'up'], (e) => {
      e.preventDefault();
      if (this.props.isCycling) return;

      const via = e.key === 'Tab' ? 'keyboard-tab' : 'keyboard-arrow';
      this.cyclingStep(this.previousHighlightedItemIndex(via), 'up', via);
    });
  }

  render() {
    const {
      onMouseEnter,
      onMouseLeave,
      recentApplications,
      highlightedItemId,
      selectItem,
      isCycling,
      themeGradient,
    } = this.props;

    return (
      <div
        style={{
          width: 270,
          height: 390,
          backgroundImage: themeGradient,
          backgroundAttachment: 'fixed',
          borderRadius: 5,
          overflow: 'hidden',
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div style={{ height: 'calc(100% - 28px)', overflow: 'hidden' }}>
          <div style={recentSubdockTitleStyle}>
            <div>RECENTS</div>

            <div style={{ fontSize: 8, color: 'rgba(255, 255, 255, .4)' }}>
              <span style={navigationIconStyle}>CTRL + TAB</span>
            </div>
          </div>

          <div style={{ height: 'calc(100% - 39px)', overflowY: 'auto', borderTop: '1px solid rgba(255, 255, 255, .1)' }}>
            {recentApplications.map((entry: ActivityEntry, index: number) => {
              const {
                label,
                context,
                imgUrl,
                type,
                themeColor,
              } = entry;
              const isHighLighted = getId(entry) === highlightedItemId;

              return <BangItem
                ctrlTabCycling={isCycling}
                key={getId(entry)}
                label={label}
                context={context!}
                imgUrl={imgUrl!}
                type={type as unknown as SearchPaneItemSelectedItem}
                themeColor={themeColor!}
                selected={isHighLighted}
                onClick={() => selectItem(entry, 'click', index)}
                smallSize={true}
                ref={(itemComp: HTMLDivElement) => {
                  if (isHighLighted) this.highlightedItemComponent = itemComp;
                }}
              />;
            })}
          </div>
        </div>

        <BangBottom ctrlTabCycling={isCycling} smallSize={true} />
      </div>
    );
  }
}

export default withGradient(GradientType.withDarkOverlay)(RecentSubdock);
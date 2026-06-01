import { theme } from '@getstation/theme';
import * as classNames from 'classnames';
// @ts-ignore: no declaration file
import * as scrollIntoView from 'dom-scroll-into-view';
// @ts-ignore: no declaration file
import * as isBlank from 'is-blank';
import * as React from 'react';
import { findDOMNode } from 'react-dom';
import { EMPTY_SECTION, flattenResults, sectionsAlwaysExpanded } from '../api';
import { SearchResultSerialized, SearchSectionSerialized } from '../duck';
import { findItemById, getId } from '../helpers/utils';
import BangItem from './BangItem';

const throttle = require('lodash.throttle');

interface CollapseSections {
  [sectionName: string]: { collapsed: boolean };
}

interface State {
  collapseSections: CollapseSections;
}

export interface Props {
  forEmptyQuery: boolean,
  items: SearchSectionSerialized[],
  historyItems: SearchResultSerialized[],
  highlightedItemId?: string,
  onItemClick: (id: string, position: number) => void,
  onResetHighlightedItem: () => void,
  onCollapseSection: () => void,
}

const shouldShowSection = (item: SearchSectionSerialized) =>
  (item.results && item.results.length > 0) || item.loading;

const sectionAlwaysExpanded = (item: SearchSectionSerialized) =>
  sectionsAlwaysExpanded.includes(item.sectionName);

const getHighlightedItem = (props: Props) =>
  findItemById(props.highlightedItemId!, flattenResults(props.items)) ||
  findItemById(props.highlightedItemId!, props.historyItems);

const itemIsInTopHits = (item: SearchResultSerialized) =>
  item.sectionKind === 'top-hits';

const itemIsCollapsed = (
  item: SearchResultSerialized,
  collapseSections: CollapseSections
) =>
  item.category &&
  collapseSections[item.category] &&
  collapseSections[item.category].collapsed &&
  !itemIsInTopHits(item);

// Inline styles

const listStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
};

const lastOpenedStyle: React.CSSProperties = {
  margin: '15px 20px 10px',
  color: 'rgba(255, 255, 255, .4)',
  ...theme.fontMixin(11, 600),
};

const sectionBaseStyle: React.CSSProperties = {
  marginBottom: 12,
};

const categoryStyle: React.CSSProperties = {
  padding: '6px 20px',
  color: 'rgba(255,255,255,0.5)',
  textTransform: 'uppercase',
  fontSize: '.8em',
  display: 'flex',
  flexFlow: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const resultsBaseStyle: React.CSSProperties = {
  marginTop: 15,
};

const loadingStyle: React.CSSProperties = {
  animationDuration: '2s',
  animationFillMode: 'forwards',
  animationIterationCount: 'infinite',
  animationName: 'bangLoading',
  animationTimingFunction: 'ease-in-out',
  opacity: 0.3,
  marginRight: 5,
};

const expandSectionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
};

const expandSectionIconStyle: React.CSSProperties = {
  fill: '#fff',
  fillOpacity: '0.5',
  transform: 'rotate(90deg)',
  transitionProperty: 'transform',
  transitionDuration: '25ms',
};

export default class BangList extends React.PureComponent<Props, State> {
  private highlightedItemComponent!: Element | null;

  constructor(props: Props) {
    super(props);

    this.componentDidUpdate = throttle(this.componentDidUpdate, 100, {
      leading: false,
    });
    this.toggleCollapse = this.toggleCollapse.bind(this);
    this.isCollapsedResults = this.isCollapsedResults.bind(this);
    this.renderSectionTitle = this.renderSectionTitle.bind(this);
    this.renderArrow = this.renderArrow.bind(this);
  }

  componentDidMount() {
    this.setState({
      collapseSections: this.props.items.reduce((state, item) => {
        (state as any)[item.sectionName] = { collapsed: true };
        return state;
      }, {}),
    });
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    const { forEmptyQuery } = this.props;
    if (!forEmptyQuery && this.state && prevProps.items !== this.props.items) {
      const { collapseSections } = this.state;

      const nextCollapseSectionsState = this.props.items.reduce(
        (collapseSectionsNewState, item) => {
          if (
            collapseSections[item.sectionName] &&
            !collapseSections[item.sectionName].collapsed
          ) {
            return collapseSectionsNewState;
          }
          (collapseSectionsNewState as any)[item.sectionName] = { collapsed: true };
          return collapseSectionsNewState;
        },
        {},
      );

      this.updateCollapsedSections(nextCollapseSectionsState);
    }

    const highlightedItem = getHighlightedItem(this.props);
    if (!highlightedItem) return;

    if (
      prevState &&
      !itemIsCollapsed(highlightedItem, prevState.collapseSections) &&
      itemIsCollapsed(highlightedItem, this.state.collapseSections)
    ) {
      this.props.onResetHighlightedItem();
      return;
    }

    const highlightedItemIsCollapsed = itemIsCollapsed(
      highlightedItem,
      this.state.collapseSections
    );

    if (!forEmptyQuery && highlightedItemIsCollapsed) {
      this.expandSectionForSearchResult(highlightedItem);
    }

    if (forEmptyQuery && !isBlank(this.state.collapseSections)) {
      this.setState({ collapseSections: {} });
    }

    if (this.highlightedItemComponent) {
      scrollIntoView(
        findDOMNode(this.highlightedItemComponent),
        findDOMNode(this),
        { onlyScrollIfNeeded: true }
      );
    }
  }

  expandSectionForSearchResult(item: SearchResultSerialized) {
    this.updateCollapsedSections({ [item!.category]: { collapsed: false } });
  }

  toggleCollapse(item: SearchSectionSerialized) {
    const nextCollapseState =
      this.state.collapseSections[item.sectionName] &&
      !this.state.collapseSections[item.sectionName].collapsed;

    this.props.onCollapseSection();
    this.updateCollapsedSections({
      [item.sectionName]: { collapsed: nextCollapseState },
    });
  }

  isCollapsedResults(item: SearchSectionSerialized) {
    if (!Boolean(this.state)) return false;

    const shouldNotCollapseFromState =
      this.state.collapseSections[item.sectionName] &&
      !this.state.collapseSections[item.sectionName].collapsed;

    if (shouldNotCollapseFromState) return false;

    return !sectionAlwaysExpanded(item);
  }

  renderSectionTitle(item: SearchSectionSerialized) {
    const clickable =
      !sectionAlwaysExpanded(item) && item.results && item.results.length > 0;
    const collapsed = this.isCollapsedResults(item);
    const showResultPart =
      !item.loading && item.results && !sectionAlwaysExpanded(item);

    return (
      <h4
        // @ts-ignore
        className={classNames('bang-category', { clickable, collapsed })}
        style={categoryStyle}
        onClick={() => this.toggleCollapse(item)}
      >
        {item.sectionName} {showResultPart && ` (${item.results!.length})`}
        <div style={expandSectionStyle}>
          {item.loading && <span style={loadingStyle}>loading</span>}

          {showResultPart && <span>{this.renderArrow(item)}</span>}
        </div>
      </h4>
    );
  }

  renderArrow(item: SearchSectionSerialized) {
    const collapsed = this.isCollapsedResults(item);

    return (
      // @ts-ignore
      <svg
        // @ts-ignore
        className={classNames('bang-expand-icon', { collapsed })}
        // @ts-ignore
        style={expandSectionIconStyle}
        xmlns="http://www.w3.org/2000/svg"
        width="15"
        height="15"
        viewBox="0 0 24 24"
      >
        <path d="M8.122 24l-4.122-4 8-8-8-8 4.122-4 11.878 12z" />
      </svg>
    );
  }

  renderItem(item: SearchResultSerialized, position: number) {
    const { highlightedItemId, forEmptyQuery } = this.props;
    const id = getId(item);
    const highlighted = highlightedItemId === id;

    return (
      <BangItem
        current={forEmptyQuery && position === 0}
        key={id}
        label={item.label}
        context={item.context}
        imgUrl={item.imgUrl}
        type={item.type}
        themeColor={item.themeColor!}
        selected={highlighted}
        // @ts-ignore
        ref={(itemComp: Element) => {
          if (highlighted) this.highlightedItemComponent = itemComp;
        }}
        onClick={() => this.props.onItemClick(id, position)}
      />
    );
  }

  render() {
    const { items, historyItems, forEmptyQuery } = this.props;

    return (
      <div style={listStyle}>
        {forEmptyQuery ? (
          <>
            <>
              <div style={lastOpenedStyle}>CURRENT</div>
              {historyItems.length > 0
                ? this.renderItem(historyItems[0], 0)
                : null}
            </>

            <div style={lastOpenedStyle}>RECENTS</div>
            <div style={sectionBaseStyle}>
              <div style={resultsBaseStyle}>
                {historyItems.map((result, position) => {
                  if (forEmptyQuery && position === 0) return null;
                  return this.renderItem(result, position);
                })}
              </div>
            </div>
          </>
) : (
          // @ts-ignore
          items.some(i => i.sectionKind === 'top-hits') &&
          items.filter(shouldShowSection).map(item => (
            // @ts-ignore
            <div
              // @ts-ignore
              className={classNames('bang-section', {
                'with-results': item.sectionName !== EMPTY_SECTION,
              })}
              // @ts-ignore
              style={sectionBaseStyle}
            >
              {item.results
                ? item.results.map((result, position) => {
                  if (forEmptyQuery && position === 0) {
                    return null;
                  }
                  return this.renderItem(result, position);
                })
                : null}
            </div>
          ))
        )}
      </div>
    );
  }

  private updateCollapsedSections(state: CollapseSections) {
    this.setState({
      collapseSections: { ...this.state.collapseSections, ...state },
    });
  }
}
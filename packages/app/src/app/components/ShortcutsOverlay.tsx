import { either, propEq, reject } from 'ramda';
import * as React from 'react';
import Overlay from '../../components/Overlay';
import { CATEGORIES, getShortcutsByCategory, KeyboardShortcut } from '../../keyboard-shortcuts';
import { Filter } from '../../utils/fp';

export interface Props {
  setVisibility: (isVisible: boolean) => {},
}

const rejectDisabledAndInvisible: Filter<KeyboardShortcut> = reject(
  either(
    propEq('disabled', true),
    propEq('doNotShowInShortcutsOverlay', true),
  )
);

const styles = {
  subtitle: {
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'uppercase' as const,
    fontSize: 11,
    fontWeight: 'bold',
  },
  item: {
    display: 'flex',
  },
  label: {
    display: 'inline-block',
    flexGrow: 1,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  kbd: {
    display: 'inline-block',
    color: 'black',
    backgroundColor: 'white',
    padding: '0 8px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 'bold',
    height: 20,
    alignSelf: 'center',
    lineHeight: '20px',
  },
  category: {
    display: 'inline-flex',
    flexDirection: 'column' as const,
    marginBottom: '2em',
    width: '100%',
  },
  content: {
    columnCount: 2,
    columnGap: '100px',
    lineHeight: '2em',
  },
};

export default class ShortcutsOverlay extends React.PureComponent<Props, {}> {
  render() {
    return (
      <Overlay
        onClose={() => this.props.setVisibility(false)}
        title="Keyboard shortcuts"
        contentStyle={styles.content}
      >
        {CATEGORIES.map((category) => {
          const shortcuts = getShortcutsByCategory(category);

          if (shortcuts.length === 0) return;
          return (
            <div style={styles.category} key={category}>
              <h3 style={styles.subtitle}>{category}</h3>
              <ul>
                {rejectDisabledAndInvisible(shortcuts).map(shortcut =>
                  <li style={styles.item} key={shortcut.id}>
                    <span style={styles.label}>{shortcut.label}</span>
                    <kbd style={styles.kbd}>{shortcut.kbd}</kbd>
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </Overlay>
    );
  }
}
import { theme } from '@getstation/theme';
import React from 'react';

export default class AboutWindowFooter extends React.PureComponent<{}, {}> {
  render() {
    return (
      <footer style={{
        display: 'flex',
        flexDirection: 'row' as const,
        position: 'absolute' as const,
        bottom: 0,
        left: 0,
        color: theme.colors.gray.middle,
        fontSize: 11,
      }}>
        <p>2019 - {new Date().getFullYear()}</p>
        <a
          style={{
            marginLeft: 10,
            fontWeight: 600,
            textDecoration: 'underline',
            cursor: 'pointer',
          }}
          href="https://medium.com/getstation/your-way-of-working-belongs-to-the-stone-age-9ff64782f40"
          target="_blank"
        >
          About Station
        </a>
        <a style={{
          marginLeft: 10,
          fontWeight: 600,
          textDecoration: 'underline',
          cursor: 'pointer',
        }} href="https://getstation.com/" target="_blank">
          Support
        </a>
      </footer>
    );
  }
}
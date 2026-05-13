import * as React from 'react';

const illustration = require('../../app/resources/illustration--half-logo.svg');

const STYLE: React.CSSProperties = {
  position: 'absolute',
  bottom: 8,
  right: 10,
  width: 298,
  height: 488,
  zIndex: -1,
};

export default class BackgroundLogo extends React.PureComponent<{}, {}> {
  render() {
    return <img src={illustration} style={STYLE} alt="Station logo" />;
  }
}
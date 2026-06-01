import React from 'react';

interface Props {
  imgUrl?: string,
  themeColor?: string,
  size?: number,
}

class AppIcon extends React.PureComponent<Props, {}> {
  render() {
    const { imgUrl, size, themeColor } = this.props;

    return (
      <div
        style={{
          position: 'relative',
          width: size || 30,
          height: size || 30,
          borderRadius: 100,
          backgroundColor: themeColor,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
      {
        imgUrl ?
        <img
          style={{
            position: 'absolute',
            width: '100%',
            transform: 'scale(1.2)',
          }}
          src={imgUrl}
          alt=""
        />
        :
        <span>&nbsp;</span>
      }
      </div>
    );
  }
}

export default AppIcon;

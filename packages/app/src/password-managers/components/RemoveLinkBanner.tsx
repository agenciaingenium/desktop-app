import { Button, Icon, IconSymbol, Size, Style, theme } from '@getstation/theme';
import React from 'react';
import { PasswordManager } from '../types';

export interface Props {
  applicationName: string,
  passwordManager: PasswordManager,
  onRemoveLink: () => void,
  onClose: () => void,
}

export default class RemoveLinkBanner extends React.PureComponent<Props, {}> {
  render() {
    const {
      applicationName, passwordManager,
      onRemoveLink, onClose,
    } = this.props;

    return (
      <div style={{
        position: 'absolute',
        left: 0,
        bottom: 0,
        width: '100%',
        boxSizing: 'border-box',
        padding: '15px 0',
        ...theme.fontMixin(13),
        color: 'rgba(0, 0, 0, .3)',
        backgroundColor: 'white',
        textAlign: 'center',
        boxShadow: '0 0 0 1px rgba(41,41,41,0.1), 0 0 40px 0 rgba(41,41,41,0.3)',
        zIndex: 3,
      }}>
        Do you want to unlink {applicationName} from {passwordManager.providerName}?

        <Button style={{ marginLeft: 10 }} onClick={onRemoveLink} btnSize={Size.XSMALL} btnStyle={Style.TERTIARY}>
          Unlink from {passwordManager.providerName}
        </Button>

        <span style={{ position: 'absolute', top: 5, right: 5, cursor: 'pointer', opacity: 0.3 }} onClick={onClose}>
          <Icon symbolId={IconSymbol.CROSS} size={25} color={'#000'} />
        </span>
      </div>
    );
  }
}
import { Button, Style } from '@getstation/theme';
import React from 'react';
import { oc } from 'ts-optchain';
import { GetApplicationStateQuery } from '../../../applications/queries@local.gql.generated';

interface Props {
  onOpenNewTab: () => void,
  onClickAddNewInstance: () => void,
  loading: boolean,
  application: GetApplicationStateQuery['application'],
}

const containerStyle: React.CSSProperties = {
  margin: '0 0 20px 20px',
  paddingTop: 20,
  left: 10,
  textAlign: 'center',
};

const buttonStyle: React.CSSProperties = {
  marginRight: 20,
  width: 'calc(100% - 20px)',
};

export default class AddApplicationButton extends React.PureComponent<Props, {}> {
  constructor(props: Props) {
    super(props);
  }

  render() {
    const { loading, application, onOpenNewTab, onClickAddNewInstance } = this.props;
    if (loading || !application) return null;

    const notSingleInstance = !oc(application.manifestData).bx_single_page();
    if (notSingleInstance) {
      return (
        <div style={containerStyle}>
          <Button style={buttonStyle} btnStyle={Style.SECONDARY} onClick={onOpenNewTab}>
            Add a new page
          </Button>
        </div>
      );
    }

    const instanceWording = oc(application.manifestData).bx_multi_instance_config.instance_wording();
    if (instanceWording) {
      return (
        <div style={containerStyle}>
          <Button style={buttonStyle} btnStyle={Style.SECONDARY} onClick={onClickAddNewInstance}>
            Add a new {instanceWording}
          </Button>
        </div>
      );
    }

    return null;
  }
}
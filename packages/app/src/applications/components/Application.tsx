import * as React from 'react';
import { Icon, IconSymbol, theme } from '@getstation/theme';
import { roundedBackground } from '@getstation/theme/dist/jss';
import { MinimalApplication } from '../graphql/withApplications';
import AppIcon from '../../dock/components/AppIcon';

/** The type of action: will influence icon used and checkbox. If not present, no action button will be shown. */
export enum ApplicationActionType {
  Add = 'Add',
  Settings = 'Settings',
  Remove = 'Remove',
}

interface OwnProps {
  application: MinimalApplication,
  onAdd: (application: MinimalApplication, iconRef?: any) => any,
  isExtension?: boolean,
  subTitle?: string,
  actionType?: ApplicationActionType,
  alternate?: boolean,
  getIconRef?: boolean,
}

const ApplicationActionButtonIconMap = {
  [ApplicationActionType.Add]: IconSymbol.PLUS,
  [ApplicationActionType.Settings]: IconSymbol.COG,
  [ApplicationActionType.Remove]: IconSymbol.CROSS,
};

const iconPinStyle: React.CSSProperties = {
  ...theme.mixins.flexbox.containerCenter,
  position: 'absolute',
  bottom: -6,
  right: -7,
  ...theme.mixins.size(22),
  backgroundColor: '#BBB',
  border: '2px solid white',
  borderRadius: '100%',
};

class ApplicationImpl extends React.PureComponent<OwnProps, { hovered: boolean }> {
  iconRef: any;

  constructor(props: OwnProps) {
    super(props);

    this.iconRef = React.createRef();
    this.state = { hovered: false };
  }

  handleAddApplication = () => {
    const { application } = this.props;

    this.props.onAdd(application, this.iconRef.current);
  }

  render() {
    const { application, isExtension, actionType, subTitle, alternate } = this.props;
    const { hovered } = this.state;

    const containerStyle: React.CSSProperties = {
      flex: 0,
      display: 'inline-flex',
      color: 'rgb(38, 33, 33)',
      alignItems: 'center',
      width: alternate ? undefined : 195,
      margin: '0 7px 10px 0',
      padding: alternate ? '0px 5px 10px 0' : 10,
      backgroundColor: 'transparent',
      borderRadius: '999px',
      transition: '200ms',
      userSelect: 'none',
      ...(hovered && !alternate ? { backgroundColor: '#EEE' } : {}),
    };

    const actionStyle: React.CSSProperties = {
      flexShrink: 0,
      ...roundedBackground('#999'),
      opacity: hovered ? 0.6 : 0,
      cursor: 'pointer',
      transition: '200ms',
    };

    const actionHoverStyle: React.CSSProperties = {
      ...actionStyle,
      opacity: hovered ? 1 : 0.6,
    };

    return (
      <div
        style={containerStyle}
        onMouseEnter={() => this.setState({ hovered: true })}
        onMouseLeave={() => this.setState({ hovered: false })}
      >
        <div style={{ margin: '0 10px 0 0', position: 'relative', width: '30px', height: '30px' }}>
          <div ref={this.iconRef} style={{ display: 'inline-block', borderRadius: '50%', width: 30 }}>
            <AppIcon imgUrl={application.iconURL} themeColor={application.themeColor} />
          </div>

          {isExtension &&
            <div style={iconPinStyle}>
              <Icon symbolId={IconSymbol.EXTENSION} size={25} color={'#5d5d5d'} />
            </div>
          }
        </div>

        <p className="app-details" style={{ flexGrow: 1, width: '130px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <strong style={{ display: 'inline-block', fontSize: '12px', fontWeight: 600 }}>{application.name}</strong>

          {subTitle && <small>{subTitle}</small>}
        </p>

        {actionType &&
          <Icon
            symbolId={ApplicationActionButtonIconMap[actionType]}
            size={24}
            style={hovered ? actionHoverStyle : actionStyle}
            onClick={this.handleAddApplication}
          />
        }
      </div>
    );
  }
}

export default ApplicationImpl;
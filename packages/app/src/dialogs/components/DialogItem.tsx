import { Button, Icon, theme } from '@getstation/theme';
import * as React from 'react';
import { nanoid } from 'nanoid';
import { oc } from 'ts-optchain';
import { getApplicationIconURL, getApplicationManifestURL, getApplicationId } from '../../applications/get';
import { useGetApplicationQuery } from '../queries@local.gql.generated';
import { APPLICATIONS_WITH_DIALOG_HINT } from '../../applications/manifest-provider/const';
import { getDialogActions, getDialogApplication, getDialogMessage, getDialogTitle } from '../get';
import { DialogItemAction, ExtendedDialogItem, ExtendedDialogItemImmutable } from '../types';

export interface OwnProps {
  dialog: ExtendedDialogItemImmutable,
  onClickDialog: (dialog: ExtendedDialogItem, buttonClicked: DialogItemAction) => void,
  themeColor: string,
}

const annoyedLink = 'https://github.com/getstation/desktop-app/wiki/FAQ-%7C-%F0%9F%93%A3-Notifications-&-badges#i-find-google-calendar-reminder-popups-annoying';

const DialogItem: React.FC<OwnProps> = ({ dialog, onClickDialog, themeColor }) => {
  const dialogApp = getDialogApplication(dialog);
  const { data } = useGetApplicationQuery({
    variables: {
      applicationId: getApplicationId(dialogApp!),
    },
    skip: !dialogApp,
  });

  const applicationName = oc(data).application.name();
  const ctaOnBottom = dialog.get('actions').some((action) => Boolean(action!.get('text')));

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: ctaOnBottom ? 'wrap' as const : 'inherit',
    position: 'absolute',
    bottom: 10,
    left: 'calc(50% + 50px)',
    transform: 'translateX(calc(-50% - 25px))',
    width: ctaOnBottom ? 400 : 300,
    margin: 0,
    padding: 20,
    color: 'white',
    backgroundColor: theme.mixinDarkenColor(themeColor, 0.3),
    borderRadius: 4,
    animation: '500ms',
  };

  const iconStyle: React.CSSProperties = {
    ...theme.mixins.size(33),
    flexShrink: 0,
    marginTop: 2,
    backgroundImage: `url(${getApplicationIconURL(dialogApp!)})`,
    backgroundSize: 'cover',
    borderRadius: 100,
  };

  const contentStyle: React.CSSProperties = {
    flexGrow: 1,
    padding: '0 10px',
    wordWrap: 'break-word',
    width: ctaOnBottom ? 'calc(100% - 33px)' : 'inherit',
  };

  const dialogMessageStyle = {
    ...theme.mixins.ellipsis(4),
    fontSize: 13,
    marginTop: 10,
  } as React.CSSProperties;

  const hintStyle: React.CSSProperties = {
    marginTop: 10,
    fontStyle: 'italic',
    fontSize: 12,
  };

  const hintLinkStyle: React.CSSProperties = {
    textDecoration: 'underline',
    cursor: 'pointer',
  };

  const buttonWrapperStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: ctaOnBottom ? 'row' : 'column',
    justifyContent: ctaOnBottom ? 'space-evenly' : 'center',
    margin: ctaOnBottom ? '20px auto 0 10%' : 'inherited',
    width: ctaOnBottom ? '90%' : 'inherited',
  };

  return (
    <div style={containerStyle}>
      <div style={iconStyle} />

      <div style={contentStyle}>
        <div style={{ fontWeight: 600, marginBottom: 5 }}>
          {applicationName}
        </div>

        <h4>{getDialogTitle(dialog)}</h4>
        <p style={dialogMessageStyle}>{getDialogMessage(dialog)}</p>

        {
          APPLICATIONS_WITH_DIALOG_HINT.includes(getApplicationManifestURL(dialogApp!)) &&
          <div style={hintStyle}>
            Annoyed by this message?
            <a style={hintLinkStyle} href={annoyedLink} target="_blank">
              Turn it into notifications.
            </a>
          </div>
        }
      </div>

      <div style={buttonWrapperStyle}>
        {
          getDialogActions(dialog).map((action: any, index) => {
            const { icon, text, style } = action;

            const onClick = (_: any) => onClickDialog(dialog.toJS(), action);

            return <div
              key={`dialog-item-${nanoid()}`}
              onClick={onClick}
              style={{ marginBottom: index === getDialogActions(dialog).length - 1 ? 0 : 5 }}
            >
              {text ? (
                <Button
                  btnStyle={style}
                >
                  {text}
                </Button>
              ) : (
                  <Button
                    btnStyle={style}
                  >
                    <Icon symbolId={icon!} size={34} />
                  </Button>
                )}

            </div>;
          })
        }
      </div>
    </div>
  );
};

export default DialogItem;

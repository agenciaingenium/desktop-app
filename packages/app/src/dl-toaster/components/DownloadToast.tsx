import { Icon, IconSymbol, theme } from '@getstation/theme';
import * as React from 'react';
import { oc } from 'ts-optchain';
import { useGetApplicationQuery } from '../queries@local.gql.generated';
import AppIcon from '../../dock/components/AppIcon';

interface OnFinished {
  doTheJob: () => void,
  delay: number,
}

export interface Props {
  applicationId: string,
  filename: string,
  completionPercent: number,
  onClickOpen: () => any,
  onClickHide: () => any,
  onFinished?: OnFinished,
  themeColor: string,
  failed?: boolean,
}

const noop = () => {};

const contentStyle = {
  ...theme.mixins.ellipsis(2),
  flexGrow: 1,
  padding: '0 10px',
} as React.CSSProperties;

const filenameStyle: React.CSSProperties = {
  width: 160,
  fontWeight: 600,
};

const filenameSuccessStyle: React.CSSProperties = {
  width: 160,
  color: 'rgba(255, 255, 255, .5)',
};

const closeStyle: React.CSSProperties = {
  ...theme.mixins.flexbox.containerCenter,
  flexShrink: 0,
  ...theme.mixins.size(25),
  backgroundColor: 'rgba(255, 255, 255, .5)',
  border: 0,
  borderRadius: 100,
  cursor: 'pointer',
  outline: 'none',
};

const DownloadToast: React.FC<Props> = ({ applicationId, filename, completionPercent, onClickOpen, onClickHide, onFinished, themeColor: propThemeColor, failed }) => {
  const { data, loading } = useGetApplicationQuery({
    variables: { applicationId },
  });

  const interpretedIconUrl = oc(data).application.manifestData.interpretedIconURL();
  const themeColor = oc(data).application.manifestData.theme_color() || propThemeColor;

  const completed = completionPercent === 100;
  const finished = completed || failed;

  if (loading) return null;
  if (completed && onFinished) {
    setTimeout(onFinished.doTheJob, onFinished.delay);
  }

  const handleClickOpen = () => {
    onClickOpen();
    onClickHide();
  };

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: 265,
    height: 65,
    backgroundColor: failed ? 'darkred' : theme.mixinDarkenColor(themeColor, 0.3),
    borderRadius: 4,
    marginTop: 5,
  };

  const progressStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: `${completionPercent}%`,
    backgroundColor: 'rgba(0, 0, 0, .3)',
    borderRadius: 4,
    transition: '200ms',
  };

  const wrapperStyle: React.CSSProperties = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    color: 'white',
    fontSize: 12,
    zIndex: 1,
  };

  const successWrapperStyle = {
    ...theme.mixins.ellipsis(2),
    cursor: 'pointer',
  } as React.CSSProperties;

  return (
    <div style={containerStyle}>
      <div style={wrapperStyle}>
        { interpretedIconUrl &&
          <AppIcon
            imgUrl={interpretedIconUrl}
            themeColor={themeColor}
          />
        }
        <div style={contentStyle} onClick={finished ? handleClickOpen : noop}>
          {
            !finished ? (
              <div>
                <div>Downloading</div>
                <div style={filenameStyle}>{filename}</div>
              </div>
            ) : (
              <div style={successWrapperStyle}>
                <div>{failed ? 'Failed download' : 'Successful download'}!</div>
                <div style={filenameSuccessStyle}>{filename}</div>
              </div>
            )
          }
        </div>

        <button style={closeStyle} onClick={onClickHide}>
          <Icon symbolId={IconSymbol.CROSS} size={25} />
        </button>
      </div>

      <div style={progressStyle} />
    </div>
  );
};

export default DownloadToast;

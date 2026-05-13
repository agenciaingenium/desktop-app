import { Button, SearchInput, Size, theme } from '@getstation/theme';
import * as React from 'react';
import { MinimalApplication } from '../../applications/graphql/withApplications';
import Application, { ApplicationActionType } from '../../applications/components/Application';

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  alignItems: 'flex-start',
  padding: '0 50px 0 50px',
};

const titleStyle: React.CSSProperties = {
  margin: '10px 0',
  ...theme.titles.h1,
  color: theme.colors.gray.dark,
};

const appsContainerStyle: React.CSSProperties = {
  width: '100%',
  height: 300,
  marginTop: 20,
  marginBottom: 20,
  display: 'grid',
  gridTemplateColumns: '50% 50%',
  gridTemplateRows: '20% 20% 20% 20% 20%',
};

const subtitleStyle: React.CSSProperties = {
  ...theme.titles.h3,
  color: theme.colors.gray.middle,
  marginBottom: 40,
};

const noResultsStyle: React.CSSProperties = {
  width: 390,
  marginTop: 15,
  textAlign: 'center',
  ...theme.fontMixin(16),
  lineHeight: '25px',
  color: theme.colors.gray.dark,
};

interface Props {
  applications: MinimalApplication[],
  selectedApplications: (MinimalApplication & { position?: DOMRect })[],
  onHandleApplicationSelect: (
    application: MinimalApplication,
    iconRef: React.RefObject<HTMLDivElement> | undefined,
  ) => any,
  onValidSubmit: () => any,
  searchInputValue: string,
  handleSearchInputValue: (value: string) => any,
  isLoading: boolean,
}

export default class OnboardingStepAppStore extends React.PureComponent<Props> {
  constructor(props: Props) {
    super(props);

    this.handleApplicationSelect = this.handleApplicationSelect.bind(this);
  }

  handleApplicationSelect(application: MinimalApplication, iconRef?: React.RefObject<HTMLDivElement>) {
    this.props.onHandleApplicationSelect(application, iconRef);
  }

  render() {
    const {
      applications, onValidSubmit, searchInputValue, handleSearchInputValue,
      selectedApplications, isLoading,
    } = this.props;

    const smallSubtitleStyle: React.CSSProperties = {
      ...theme.titles.h3,
      color: theme.colors.gray.middle,
      margin: '20px 0 20px 10px',
      fontStyle: 'italic',
      ...theme.fontMixin(12, 500),
      visibility: selectedApplications.length > 2 ? 'hidden' : 'initial',
    };

    return (
      <div style={containerStyle}>
        <h1 style={titleStyle}>
          Select your most used applications
        </h1>

        <SearchInput
          value={searchInputValue}
          placeholder="Search an app..."
          onChange={handleSearchInputValue}
        />

        <div style={appsContainerStyle}>
          {applications.length === 0 &&
            <div style={noResultsStyle}>
              <p>Can't find your app?</p>
              <p>You can request it later in the app store.</p>
            </div>
          }

          {applications.length > 0 && applications.map((app: MinimalApplication) =>
            <Application
              key={app.id}
              application={app}
              onAdd={this.handleApplicationSelect}
              actionType={selectedApplications.find((a: MinimalApplication) =>
                a.id === app.id) ? ApplicationActionType.Remove : ApplicationActionType.Add
              }
              getIconRef={true}
            />
          )
          }
        </div>

        <p style={subtitleStyle}>
          {selectedApplications.length > 14 && 'You have selected 15 apps. '}Don't worry, you can pick more later!
        </p>

        <Button btnSize={Size.BIG} onClick={onValidSubmit} disabled={selectedApplications.length < 3} isLoading={isLoading}>
          Start Station
        </Button>

        <p style={smallSubtitleStyle}>Select at least 3 apps</p>
      </div>
    );
  }
}

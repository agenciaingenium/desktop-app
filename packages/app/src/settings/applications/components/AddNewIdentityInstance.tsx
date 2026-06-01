import { IconSymbol, Size, ButtonIcon, Style } from '@getstation/theme';
import React from 'react';

type Identity = {
  id: string,
  email: string,
  imageURL?: string,
};

type Props = {
  name: string,
  instanceTypeWording: string,
  identities: Identity[],
  usedIdentityIds: string[],
  onChooseIdentity: (identityId: string) => void,
  onAddNewAccount: () => void,
};

const containerStyle: React.CSSProperties = {
  maxWidth: 300,
  margin: '20px 0',
};

const identityListStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: '0 0 12px',
};

const identityItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '8px 12px',
  marginBottom: 2,
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  cursor: 'pointer',
  transition: 'background-color 100ms ease-out',
  fontSize: 13,
  fontWeight: 600,
};

const identityItemHoverStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
};

const identityImageStyle: React.CSSProperties = {
  width: 20,
  height: 20,
  borderRadius: '50%',
  marginRight: 10,
  border: '2px solid white',
  flexShrink: 0,
};

const identityPlaceholderStyle: React.CSSProperties = {
  width: 20,
  height: 20,
  borderRadius: '50%',
  marginRight: 10,
  border: '2px solid white',
  backgroundColor: 'rgba(255, 255, 255, 0.3)',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 10,
  color: 'white',
};

const emailStyle: React.CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

function AddNewIdentityInstance({
  name,
  instanceTypeWording = 'instance',
  identities,
  usedIdentityIds,
  onChooseIdentity,
  onAddNewAccount,
}: Props) {
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  const availableIdentities = identities.filter(
    (identity) => !usedIdentityIds.includes(identity.id)
  );

  const wording = instanceTypeWording === 'instance'
    ? `instance of ${name}` : instanceTypeWording;

  return (
    <div style={containerStyle}>
      {availableIdentities.length > 0 && (
        <ul style={identityListStyle}>
          {availableIdentities.map((identity) => (
            <li
              key={identity.id}
              style={{
                ...identityItemStyle,
                ...(hoveredId === identity.id ? identityItemHoverStyle : {}),
              }}
              onClick={() => onChooseIdentity(identity.id)}
              onMouseEnter={() => setHoveredId(identity.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {identity.imageURL ? (
                <img style={identityImageStyle} src={identity.imageURL} alt="" />
              ) : (
                <div style={identityPlaceholderStyle}>
                  {identity.email.charAt(0).toUpperCase()}
                </div>
              )}
              <span style={emailStyle}>{identity.email}</span>
            </li>
          ))}
        </ul>
      )}
      <ButtonIcon
        text={`Add a new ${wording}`}
        symbolId={IconSymbol.PLUS}
        btnStyle={Style.SECONDARY}
        btnSize={Size.XSMALL}
        onClick={onAddNewAccount}
      />
    </div>
  );
}

export default AddNewIdentityInstance;
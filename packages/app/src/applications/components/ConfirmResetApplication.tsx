import { Modal } from '@getstation/theme';
import * as React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateUI } from '../../ui/redux-ui-compat';
import { oc } from 'ts-optchain';
import { StationState } from '../../types';
import { resetApplication } from '../duck';
import { useGetApplicationQuery } from '../queries@local.gql.generated';
import { getUIConfirmResetApplicationModalIsVisible } from '../selectors';

const currentWindowId = window.station.window.getId();

interface OwnProps {
  applicationId: string,
}

const ConfirmResetApplication: React.FC<OwnProps> = ({ applicationId }) => {
  const isVisible = useSelector((state: StationState) =>
    getUIConfirmResetApplicationModalIsVisible(state, currentWindowId)
  );
  const dispatch = useDispatch();

  const { data, loading } = useGetApplicationQuery({
    variables: { applicationId },
  });

  const applicationName = oc(data).application.manifestData.name();

  const onReset = (id: string) => dispatch(resetApplication(id, 'help'));
  const onCancel = () => dispatch(updateUI('confirmResetApplicationModal', 'isVisible', false));

  if (!loading && isVisible) {
    return (
      <Modal
        title={`Reset ${applicationName}`}
        onCancel={onCancel}
        onContinue={() => applicationId && onReset(applicationId)}
        cancelContent={'Cancel'}
        continueContent={'Continue'}
      >
        <p style={{ textAlign: 'center', width: '80%', margin: 'auto' }}>
          This will clear all of {applicationName} pages and send you back home.
        </p>
      </Modal>
    );
  }
  return null;
};

export default ConfirmResetApplication;

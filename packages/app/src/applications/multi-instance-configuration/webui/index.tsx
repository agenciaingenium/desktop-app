import * as React from 'react';
import { createRoot } from 'react-dom/client';

import { getSearchParams } from '../../../webui/helpers';
import MultiInstanceConfigurator from './MultiInstanceConfigurator';

const params = getSearchParams();
const manifestURL = params.get('manifestURL')!;
const applicationId = params.get('applicationId')!;

createRoot(document.getElementById('root')!).render(
  <MultiInstanceConfigurator
    applicationId={applicationId}
    manifestURL={manifestURL}
  />
);

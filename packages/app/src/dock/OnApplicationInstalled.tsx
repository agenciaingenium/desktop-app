import { useEffect } from 'react';
import { useOnApplicationInstalledQuery } from './queries@local.gql.generated';

type Props = {
  callback: (applicationId: string) => void,
};

export const OnApplicationInstalled = ({ callback }: Props) => {
  const { data } = useOnApplicationInstalledQuery();

  useEffect(() => {
    if (!data || !data.onApplicationInstalled) return;
    callback(data.onApplicationInstalled.applicationId);
  }, [data, callback]);

  return null;
};

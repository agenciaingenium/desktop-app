import { List } from 'immutable';
import { Instance, Instances } from './types';

export const withInstanceNumber = (instances: Instances): Instances => {
  const grouped = instances.groupBy((acc: Instance) => acc.name);

  return grouped
    .map((groupedInstances: Instances) => {
      if ((groupedInstances as any).size > 1) {
        return groupedInstances.map(
          (instance: Instance, i: number) =>
            ({ ...instance, name: `${instance.name} #${i + 1}` })
        );
      }

      return groupedInstances;
    })
    .toList()
    .flatten()
    .filter(Boolean) as unknown as Instances;
};

export const orderInstances = (instances: Instances, applicationIds: List<string>): Instances => {
  return List(applicationIds
    .map(id => {
      return instances.find((instance: Instance) => instance.id === id);
    })
    .filter(Boolean)
  ) as unknown as Instances;
};

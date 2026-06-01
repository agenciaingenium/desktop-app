import Immutable from 'immutable';
import { ServicesData } from '../database/model';
import { KeyValueProxyMixin } from '../persistence/mixins';

const parse = (v: string) => Immutable.fromJS(JSON.parse(v));

export class ServicesDataProxyMixin extends KeyValueProxyMixin({
  model: ServicesData,
  key: 'manifestURL',
  // @ts-ignore
  mapStateToObject: async state =>
    state.map((value: any) => value.map((value2: any) => JSON.stringify(value2))).toJS(),
  // @ts-ignore
  mapObjectToState: async (lines: { manifestURL: string, key: string, value: string}[]) => {
    return Immutable.fromJS(lines.map(l => ({
      manifestURL: l.manifestURL,
      [l.key]: parse(l.value),
    })))
      // @ts-ignore
      .groupBy((v: Immutable.Map<string, any>) => v.get('manifestURL') as string)
      // @ts-ignore
      .map((v: Immutable.List<any>) => Immutable.Map().merge(...v.toArray()))
      // @ts-ignore
      .map((v: Immutable.Map<string, any>) => v.delete('manifestURL'));
  },
}) {
}

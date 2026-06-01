import Immutable from 'immutable';
import { distinctUntilChanged } from 'rxjs/operators';
import { getTabWebcontentsById } from './selectors';
import { Resolvers } from '../graphql/resolvers-types.generated';
import { subscribeStore } from '../utils/observable';

const resolvers: Resolvers = {
  Query: {
    getTabWebContent: (_obj: any, args: any, context: { store: any }): any => {
      return subscribeStore(
        context.store as any,
        state => getTabWebcontentsById(state as any, args.tabId)
      ).pipe(distinctUntilChanged(Immutable.is));
    },
  },
};

export default resolvers;

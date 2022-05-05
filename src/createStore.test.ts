import { createStore, StoreProps } from './createStore';

type StoreState = {
  user?: string;
};

describe('createStore', () => {
  let params: StoreProps<StoreState>;

  beforeEach(() => {
    params = {
      state: {},
      actions: {
        login: async (_state: StoreState, payload: string) => {
          return await new Promise<StoreState>((resolve) => {
            setTimeout(() => {
              return resolve({
                user: payload,
              });
            }, 2000);
          });
        },
        logout: async () => {
          return await new Promise<StoreState>((resolve) => {
            setTimeout(() => {
              resolve({});
            }, 2000);
          });
        },
      },
      getters: {
        isLoggedIn: (state: StoreState): boolean => !!state.user,
      },
      plugins: [],
    };
  });

  describe('state', () => {
    test('updates the state when dispatching an action', async () => {
      const store = createStore(params);
      await store.dispatch({ type: 'login', payload: 'curtis' });

      expect(store.state.getValue()).toEqual({ user: 'curtis' });
    });
  });

  describe('getters', () => {
    test('updates the getters when dispatching an action', async () => {
      const { getters, dispatch } = createStore(params);
      await dispatch({ type: 'login', payload: 'curtis' });

      expect(getters.isLoggedIn.getValue()).toEqual(true);
    });
  });
});

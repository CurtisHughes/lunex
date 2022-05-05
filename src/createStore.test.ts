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

  describe('actions', () => {
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

  describe('plugins', () => {
    test('calls the plugin for every action', async () => {
      const plugin = jest.fn();
      const store = createStore({
        ...params,
        plugins: [plugin],
      });

      await store.dispatch({ type: 'login', payload: 'curtis' });
      await store.dispatch({ type: 'logout' });

      expect(plugin).toHaveBeenCalledTimes(2);
    });

    test('passes the action type and payload to the plugin', async () => {
      const plugin = jest.fn();
      const store = createStore({
        ...params,
        plugins: [plugin],
      });
      await store.dispatch({ type: 'login', payload: 'curtis' });

      expect(plugin).toHaveBeenCalledWith({
        state: {
          user: 'curtis'
        },
        action: {
          type: 'login',
          payload: 'curtis',
        },
      });
    });
  });
});

import { createStore, StoreProps } from './createStore';

type User = {
  name: string;
  admin?: boolean;
};

type StoreState = {
  user?: User;
};

type StoreGetters = {
  isLoggedIn: boolean;
  isAdmin: boolean;
}

type StoreActions = {
  login: (payload: User) => Promise<StoreState>;
  logout: () => Promise<StoreState>;
}

describe('createStore', () => {
  let params: StoreProps<StoreState, StoreGetters, StoreActions>;

  beforeEach(() => {
    params = {
      state: {},
      actions: {
        login: async (_state: StoreState, payload: User) => {
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
        isAdmin: (state: StoreState): boolean => !!state.user?.admin,
      },
      plugins: [],
    };
  });

  describe('actions', () => {
    test('updates the state when dispatching an action', async () => {
      const store = createStore(params);
      await store.actions.login({ name: 'curtis' });

      expect(store.state).toEqual({ user: { name: 'curtis' } });
    });

    test('updates the state subject when dispatching an action', async () => {
      const store = createStore(params);
      await store.actions.login({ name: 'curtis' });

      expect(store.state$.getValue()).toEqual({ user: { name: 'curtis' } });
    });
  });

  describe('getters', () => {
    test('updates the getters when dispatching an action', async () => {
      const { getters, actions } = createStore(params);
      await actions.login({ name: 'curtis', admin: true });

      expect(getters.isLoggedIn).toEqual(true);
      expect(getters.isAdmin).toEqual(true);
    });

    test('updates the getter subjects when dispatching an action', async () => {
      const { getters, actions } = createStore(params);
      await actions.login({ name: 'curtis' });

      expect(getters.isLoggedIn$.getValue()).toEqual(true);
      expect(getters.isAdmin$.getValue()).toEqual(false);
    });
  });

  describe('plugins', () => {
    test('calls the plugin for every action', async () => {
      const plugin = jest.fn();
      const store = createStore({
        ...params,
        plugins: [plugin],
      });

      await store.actions.login('curtis');
      await store.actions.logout();

      expect(plugin).toHaveBeenCalledTimes(2);
    });

    test('passes the current state to the plugin', async () => {
      const plugin = jest.fn();
      const store = createStore({
        ...params,
        plugins: [plugin],
      });
      await store.actions.login('curtis');

      expect(plugin).toHaveBeenCalledWith({
        user: 'curtis',
      });
    });
  });
});

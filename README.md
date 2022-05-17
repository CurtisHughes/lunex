# Lunex

Lunex is a [lightweight](https://bundlephobia.com/package/lunex), framework agnostic, typescript friendly, state management **library** inspired by [Vuex](https://vuex.vuejs.org/#what-is-a-state-management-pattern)/[Pinia](https://pinia.vuejs.org/).

## Installation

```sh
yarn add lunex
```

```sh
npm install lunex
```

## Getting Started

Create a store:

```ts
// authStore.ts
import { createStore } from 'lunex';
import { api } from '~/api';

type User = {
  name: string;
};

type StoreState = {
  user?: User;
};

type StoreGetters = {
  isLoggedIn: boolean;
};

type StoreActions = {
  login: (payload: User) => Promise<void>;
  logout: () => Promise<void>;
};

export const authStore = createStore<StoreState, StoreGetters, StoreActions>({
  state: {},
  actions: {
    login: async (
      state: StoreState,
      payload: { username: string; password: string },
    ) => {
      const user = await api.login(username, password);
      return { user };
    },
    logout: async (state: StoreState) => {
      await api.logout();
      return {};
    },
  },
  getters: {
    isLoggedIn: (state: StoreState): boolean => !!state.user,
  },
  plugins: [
    (state: StoreState) => console.debug('PLUGIN: ', JSON.stringify(state)),
  ],
});
```

then _use_ the store:

```ts
import { authStore } from '~/stores/authStore';

console.log(JSON.stringify(authStore.state));

// {}

authStore.state$.subscribe((state) =>
  console.log(`SUBSCRIPTION(state$):  ${JSON.stringify(state)}`),
);

console.log(JSON.stringify(authStore.isLoggedIn));

// false

authStore.isLoggedIn$.subscribe((isLoggedIn) =>
  console.log(
    `SUBSCRIPTION(isLoggedIn$): user is ${isLoggedIn ? '' : 'not'} logged in`,
  ),
);

authStore.login({ username: 'user-1', password: 'pass123' });

// PLUGIN: { user: { name: 'curtis' } }

// SUBSCRIPTION(state$):  { user: { name: 'curtis' } }

// SUBSCRIPTION(isLoggedIn$): user is logged in

console.log(JSON.stringify(authStore.state));

// { user: { name: 'curtis' } }

console.log(JSON.stringify(authStore.isLoggedIn));

// true

authStore.logout();

// PLUGIN: {}

// SUBSCRIPTION(state$):  {}

// SUBSCRIPTION(isLoggedIn$): user is not logged in
```

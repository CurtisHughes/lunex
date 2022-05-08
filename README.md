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
  admin?: boolean;
};

type StoreState = {
  user?: User;
};

export const authStore = createStore<StoreState>({
  state: {},
  actions: {
    login: async (state: StoreState, payload: any) => {
      return await api.login(payload.username, payload.password);
    },
    login: async (state: StoreState) => {
      await api.logout();
      return {};
    },
  },
  getters: {
    isLoggedIn: (state: StoreState): boolean => !!state.user,
    isAdmin: (state: StoreState): boolean => !!state.user?.admin,
  },
  plugins: [(state) => console.log(`STATE: `, JSON.stringify(state))],
});
```

then _use_ the store:

```tsx
// react example
```

```tsx
// vue example
```

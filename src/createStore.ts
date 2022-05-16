import { BehaviorSubject, Subject } from 'rxjs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Store<S, G extends Record<string, any>> = {
  state: S;
  state$: BehaviorSubject<S>;
  actions: Record<string, (payload?: any) => Promise<S> | S>; // eslint-disable-line @typescript-eslint/no-explicit-any
  getters: G & {
    [P in keyof G as `${string & P}$`]: BehaviorSubject<G[P]>;
  };
};

export type Plugin<P> = (payload: P) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type StoreProps<S, G extends Record<string, any>> = {
  state: S;
  getters?: {
    [K in keyof G]: (state: S) => G[K];
  };
  actions?: Record<string, (state: S, payload: any) => Promise<S> | S>; // eslint-disable-line @typescript-eslint/no-explicit-any
  plugins?: Plugin<S>[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createStore<S, G extends Record<string, any>>({
  state: initialState,
  actions = {},
  getters = {} as G,
  plugins = [],
}: StoreProps<S, G>): Store<S, G> {
  const stateSubject: BehaviorSubject<S> = new BehaviorSubject(initialState);
  const actionSubject: Subject<S> = new Subject();

  actionSubject.subscribe((state) => stateSubject.next(state));
  plugins.forEach((plugin) => actionSubject.subscribe(plugin));

  return {
    state$: stateSubject,
    get state() {
      return stateSubject.getValue();
    },
    actions: Object.entries(actions).reduce(
      (acc, [key, action]) => ({
        ...acc,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key]: async (payload: any) => {
          const state = await action(stateSubject.value, payload);
          actionSubject.next(state);
        },
      }),
      {},
    ),
    getters: Object.entries(getters).reduce((acc, [key, value]) => {
      const subject = new BehaviorSubject(value(stateSubject.getValue()));
      stateSubject.subscribe((state) => {
        const nextValue = value(state);
        subject.next(nextValue);
      });

      /* Object.defineProperty is necessary (instead of spread) to preserve getters and setters
      https://zellwk.com/blog/copy-properties-of-one-object-to-another-object/ */
      Object.defineProperty(acc, `${key}$`, { value: subject });
      Object.defineProperty(acc, key, {
        get() {
          return subject.getValue();
        },
      });

      return acc;
    }, {} as { [P in keyof G]: ReturnType<G[P]> } & { [P in keyof { [P in keyof G]: ReturnType<G[P]> } as `${string & P}$`]: BehaviorSubject<{ [P in keyof G]: ReturnType<G[P]> }[P]> }),
  };
}

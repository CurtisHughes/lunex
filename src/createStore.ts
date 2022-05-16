import { BehaviorSubject, Subject } from 'rxjs';

export type Store<
  S,
  G extends Record<string, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  A extends Record<string, (payload?: any) => Promise<void> | void>, // eslint-disable-line @typescript-eslint/no-explicit-any
> = {
  state: S;
  state$: BehaviorSubject<S>;
  actions: {
    [K in keyof A]: (...payload: Parameters<A[K]>) => Promise<void> | void;
  };
  getters: G & {
    [P in keyof G as `${string & P}$`]: BehaviorSubject<G[P]>;
  };
};

export type Plugin<P> = (payload: P) => void;

export type StoreProps<
  S,
  G extends Record<string, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  A extends Record<string, (payload?: any) => Promise<void> | void>, // eslint-disable-line @typescript-eslint/no-explicit-any
> = {
  state: S;
  getters?: {
    [K in keyof G]: (state: S) => G[K];
  };
  actions?: {
    [K in keyof A]: (state: S, ...payload: Parameters<A[K]>) => Promise<S> | S;
  };
  plugins?: Plugin<S>[];
};

export function createStore<
  S,
  G extends Record<string, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  A extends Record<string, (payload?: any) => Promise<void> | void>, // eslint-disable-line @typescript-eslint/no-explicit-any
>({
  state: initialState,
  actions = {} as {
    [K in keyof A]: (state: S, ...payload: Parameters<A[K]>) => Promise<S> | S;
  },
  getters = {} as {
    [K in keyof G]: (state: S) => G[K];
  },
  plugins = [],
}: StoreProps<S, G, A>): Store<S, G, A> {
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
      {} as {
        [K in keyof A]: (...payload: Parameters<A[K]>) => Promise<void> | void;
      },
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

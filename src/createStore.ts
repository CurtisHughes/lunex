import { BehaviorSubject, Subject } from 'rxjs';

export type Store<S> = {
  state: S;
  state$: BehaviorSubject<S>;
  actions: Record<string, (payload?: any) => Promise<S> | S>; // eslint-disable-line @typescript-eslint/no-explicit-any
  getters: Record<string, BehaviorSubject<any> | any>; // eslint-disable-line @typescript-eslint/no-explicit-any
};

export type Plugin<P> = (payload: P) => void;

export type StoreProps<S> = {
  state: S;
  getters?: Record<string, (s: S) => any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  actions?: Record<string, (state: S, payload: any) => Promise<S> | S>; // eslint-disable-line @typescript-eslint/no-explicit-any
  plugins?: Plugin<S>[];
};

export function createStore<S>({
  state: initialState,
  actions = {},
  getters = {},
  plugins = [],
}: StoreProps<S>): Store<S> {
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
    }, {}),
  };
}

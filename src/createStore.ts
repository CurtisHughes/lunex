import { BehaviorSubject, Subject } from 'rxjs';

export type Action = {
  type: string;
  payload?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

export type Store<S> = {
  state: BehaviorSubject<S>;
  // getters: Record<string, Subscription>;
  dispatch: <T extends Action = Action>(action: T) => Promise<void> | void;
};

export type Plugin<P> = (payload: P) => void;

export type ActionSubjectContext<S> = {
  state: S;
  action: Action;
};

export type StoreProps<S> = {
  state: S;
  // getters?: Record<string, <T>(s: S) => T>;
  actions?: Record<string, (state: S, payload: any) => Promise<S> | S>; // eslint-disable-line @typescript-eslint/no-explicit-any
  plugins?: Plugin<ActionSubjectContext<S>>[];
};

export function createStore<S>({
  state: initialState,
  actions = {},
  // getters = {},
  plugins = [],
}: StoreProps<S>): Store<S> {
  const stateSubject: BehaviorSubject<S> = new BehaviorSubject(initialState);
  const actionSubject: Subject<ActionSubjectContext<S>> = new Subject();

  async function dispatch<M extends Action = Action>({ type, payload }: M) {
    const state = await actions[type](stateSubject.value, payload);
    actionSubject.next({
      state,
      action: {
        type,
        payload,
      },
    });
  }

  actionSubject.subscribe(({ state }) => stateSubject.next(state));
  plugins.forEach((plugin) => actionSubject.subscribe(plugin));

  return {
    state: stateSubject,
    dispatch,
    // getters: Object.entries(getters).reduce(
    //   (acc, [key, value]) => ({ ...acc, [key]: stateSubject.subscribe(value) }),
    //   {},
    // ),
  };
}

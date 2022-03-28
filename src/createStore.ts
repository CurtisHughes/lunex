import { BehaviorSubject, Subject } from "rxjs";

export type Store<S> = {
  state: BehaviorSubject<S>;
  dispatch: <A extends Action = Action>(action: A) => Promise<void>;
  commit: <T extends Mutation = Mutation>(mutation: T) => void;
};

type Plugin<P> = (payload: P) => void;

export type CommitSubjectContext<S> = {
  state: S;
  mutation: Mutation;
};

export type Mutation = {
  type: string;
  payload?: any;
};

export type MutationContext<S = any> = {
  state: S;
};

export type Action = {
  type: string;
  payload?: any;
};

export type ActionContext<S = any> = {
  state: S;
  commit: Store<S>["commit"];
};

export type StoreProps<S> = {
  state: S;
  actions: Record<
    string,
    (context: ActionContext<S>, payload: any) => Promise<void> | void
  >;
  mutations: Record<string, (context: MutationContext<S>, payload: any) => S>;
  plugins: Plugin<CommitSubjectContext<S>>[];
};

export function createStore<S>({
  state,
  actions,
  mutations,
  plugins,
}: StoreProps<S>): Store<S> {
  const stateSubject: BehaviorSubject<S> = new BehaviorSubject(state);
  const commitSubject: Subject<CommitSubjectContext<S>> = new Subject();

  async function commit<M extends Mutation = Mutation>({ type, payload }: M) {
    const state = mutations[type]({ state: stateSubject.value }, payload);
    commitSubject.next({
      state,
      mutation: {
        type,
        payload,
      },
    });
  }

  async function dispatch<A extends Action = Action>({ type, payload }: A) {
    return await actions[type]({ commit, state: stateSubject.value }, payload);
  }

  commitSubject.subscribe(({ state }) => stateSubject.next(state));
  plugins.forEach((plugin) => commitSubject.subscribe(plugin));

  return {
    state: stateSubject,
    dispatch,
    commit,
  };
}

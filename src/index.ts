/* eslint-disable max-params */
import { join } from "path-browserify";

type RecursiveValue<T> = {
  [key in string]: T | RecursiveValue<T>;
};

type StringFn = (...args: any) => string;
type AnyFn = (...args: any) => any;
type StringOrStringFn = string | StringFn;
type StringOrAnyFn = string | AnyFn;

type StringOrRouteFn = string | RouteFn<any, any>;

type PathTree = RecursiveValue<StringOrRouteFn>;

function addPrefix(
  prefix: string,
  routePrefix?: string
): <T extends PathTree>(object: T) => BasicPrefix<T>;
function addPrefix<Fn extends StringFn, RoutePath extends StringOrStringFn>(
  getUrl: Fn,
  routePrefix: RoutePath
): <T extends PathTree>(
  object: T
) => HOFPrefix<T, Fn, RoutePath extends string ? string : RoutePath>;
function addPrefix(prefix: any, routePrefix: any = prefix) {
  const strategy =
    typeof prefix === "string" ? sameArgumentsStrategy : HOFStrategy;
  return (object: Record<any, any>): any => {
    return addPrefixHelper(object, prefix, routePrefix, strategy);
  };
}

const addMergingArgumentPrefix = <
  Fn extends StringFn,
  RoutePath extends StringOrStringFn
>(
  getUrl: Fn,
  routePath: RoutePath
) => {
  return <T extends PathTree>(
    object: T
  ): ArgumentMergePrefix<
    T,
    Fn,
    RoutePath extends string ? string : RoutePath
  > => {
    return addPrefixHelper(object, getUrl, routePath, sameArgumentsStrategy);
  };
};

const addSplittingArgumentPrefix = <
  Fn extends StringFn,
  RoutePath extends StringOrStringFn
>(
  getUrl: Fn,
  routePath: RoutePath
) => {
  return <T extends PathTree>(
    object: T
  ): ArgumentSplittingPrefix<
    T,
    Fn,
    RoutePath extends string ? string : RoutePath
  > => {
    return addPrefixHelper(object, getUrl, routePath, argumentsSplitStrategy);
  };
};

type BasicPrefix<T> = {
  [key in keyof T]: T[key] extends string
    ? RouteFn<() => string>
    : T[key] extends CallableFunction
    ? T[key]
    : BasicPrefix<T[key]>;
};

type HOFPrefix<T, Fn extends StringFn, RoutePath extends StringOrStringFn> = {
  [key in keyof T]: T[key] extends string
    ? RouteFn<Fn, RoutePath>
    : T[key] extends RouteFn<infer Fn2, infer RoutePath2>
    ? HOFMerge<Fn, Fn2, RoutePath, RoutePath2>
    : HOFPrefix<T[key], Fn, RoutePath>;
};

type ArgumentMergePrefix<
  T,
  Fn extends StringFn,
  RoutePath extends StringOrStringFn
> = {
  [key in keyof T]: T[key] extends string
    ? RouteFn<Fn, RoutePath>
    : T[key] extends RouteFn<infer Fn2, infer RoutePath2>
    ? ArgumentsMerge<Fn, Fn2, RoutePath, RoutePath2>
    : ArgumentMergePrefix<T[key], Fn, RoutePath>;
};

type ArgumentSplittingPrefix<
  T,
  Fn extends StringFn,
  RoutePath extends StringOrStringFn
> = {
  [key in keyof T]: T[key] extends string
    ? RouteFn<Fn, RoutePath>
    : T[key] extends RouteFn<infer Fn2, infer RoutePath2>
    ? ArgumentsSplit<Fn, Fn2, RoutePath, RoutePath2>
    : ArgumentSplittingPrefix<T[key], Fn, RoutePath>;
};

type ArgumentsSplit<
  Fn1 extends StringFn,
  Fn2 extends StringFn,
  RoutePath1 extends StringOrStringFn,
  RoutePath2 extends StringOrStringFn
> = RouteFn<SplitArgs<Fn1, Fn2>, SplitArgs<RoutePath1, RoutePath2>>;

type SplitArgs<
  Fn1 extends StringOrStringFn,
  Fn2 extends StringOrStringFn
> = Fn1 extends (...args: any[]) => string
  ? Fn2 extends StringFn
    ? (...args: [...Parameters<Fn1>, ...Parameters<Fn2>]) => string
    : Fn1
  : Fn2;

type ArgumentsMerge<
  Fn1 extends StringFn,
  Fn2 extends StringFn,
  RoutePath1 extends StringOrStringFn,
  RoutePath2 extends StringOrStringFn
> = RouteFn<MergeArgs<Fn1, Fn2>, MergeArgs<RoutePath1, RoutePath2>>;

type MergeArgs<
  Fn1 extends StringOrStringFn,
  Fn2 extends StringOrStringFn
> = Fn1 extends (...args: any[]) => string
  ? Fn2 extends StringFn
    ? (...args: MergeParams<Parameters<Fn1>, Parameters<Fn2>>) => string
    : Fn1
  : Fn2;

type HOFMerge<
  Fn1 extends StringFn,
  Fn2 extends StringFn,
  RoutePath1 extends StringOrStringFn,
  RoutePath2 extends StringOrStringFn
> = RouteFn<HOFArgs<Fn1, Fn2>, HOFArgs<RoutePath1, RoutePath2>>;

type HOFArgs<
  Fn1 extends StringOrStringFn,
  Fn2 extends StringOrStringFn
> = Fn1 extends (...args: any[]) => any
  ? Fn2 extends AnyFn
    ? (...args: Parameters<Fn1>) => Fn2
    : Fn1
  : Fn2;

const addPrefixHelper = (
  obj: any,
  prefix: StringOrStringFn,
  routePrefix: StringOrStringFn,
  merge: MergeStrategy
): any => {
  const newObj: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === "object") {
        newObj[key] = addPrefixHelper(obj[key], prefix, routePrefix, merge);
      } else {
        newObj[key] = addPath(prefix, routePrefix, obj[key], merge);
      }
    }
  }
  return newObj;
};

interface MergeStrategy {
  (prefix: StringOrStringFn, to: StringOrAnyFn): StringOrAnyFn;
}
interface FuncMerge {
  (prefix: StringFn): (
    ...args: any
  ) => { prefixStr: string; toArgs: any[] | null };
}

const asFunction = <V extends any>(
  value: V
): V extends CallableFunction ? V : () => V => {
  if (typeof value === "function") return value as any;
  return (() => value) as any;
};

const addPath = (
  prefix: StringOrStringFn,
  routePrefix: StringOrStringFn,
  to: StringOrStringFn,
  merge: MergeStrategy
) => {
  const merged = asFunction(merge(prefix, to));
  if (
    typeof to === "function" &&
    (to as RouteFn<any, any>)[mataRoutePathKey] !== undefined
  ) {
    merged[mataRoutePathKey] = merge(
      routePrefix,
      (to as any)[mataRoutePathKey]
    );
  } else if (typeof to === "string") {
    merged[mataRoutePathKey] = merge(routePrefix, to);
  }
  return merged;
};

const createMergeStrategy = (merge: FuncMerge): MergeStrategy => {
  return (prefix, to) => {
    if (typeof to === "string") {
      if (typeof prefix === "string") {
        return join(prefix, to);
      } else {
        return (...args: any) => {
          return join(prefix(...args), to);
        };
      }
    }
    const fn = merge(typeof prefix === "string" ? () => prefix : prefix);
    return (...args: any) => {
      const { toArgs, prefixStr } = fn(...args);
      const rec = recursiveJoin(prefixStr, to);
      if (toArgs === null) return rec;
      return rec(...toArgs);
    };
  };
};

const sameArgumentsStrategy: MergeStrategy = createMergeStrategy(prefix => {
  return (...args: any) => ({
    prefixStr: prefix(...args),
    toArgs: args,
  });
});

const argumentsSplitStrategy: MergeStrategy = createMergeStrategy(prefix => {
  return (...args: any) => {
    const prefixArgs = args.slice(0, prefix.length);
    const toArgs = args.slice(prefix.length);
    return {
      prefixStr: prefix(...prefixArgs),
      toArgs,
    };
  };
});

const HOFStrategy: MergeStrategy = createMergeStrategy(prefix => {
  return (...args: any) => ({
    prefixStr: prefix(...args),
    toArgs: null,
  });
});

const recursiveJoin = (prefix: string, to: (...args: any) => any) => {
  return (...args: any) => {
    const res = to(...args);
    if (typeof res === "function") {
      return recursiveJoin(prefix, res);
    }
    return join(prefix, res);
  };
};

export const mataRoutePathKey = "routePath";

const withParams = <Fn extends StringFn, RoutePath extends StringOrStringFn>(
  getUrl: Fn,
  routePath: RoutePath
): RouteFn<Fn, RoutePath extends string ? string : RoutePath> => {
  const newFn = (...args: any) => {
    return getUrl(...args);
  };
  (newFn as any)[mataRoutePathKey] = routePath;
  return newFn as any;
};

export type RouteFn<
  Fn extends AnyFn,
  RoutePath extends StringOrAnyFn = string
> = Fn & { [key in typeof mataRoutePathKey]: RoutePath };

export {
  addPrefix,
  addSplittingArgumentPrefix,
  addMergingArgumentPrefix,
  withParams,
  join,
};

/* type Tail<Tuple extends any[]> = ((...args: Tuple) => any) extends (
  _: any,
  ..._1: infer Rest
) => any
  ? Rest
  : never;
 */

/**
 * caveat: merges only first parameters
 */
type MergeParams<T1 extends any[], T2 extends any[]> = T1 extends []
  ? T2
  : T2 extends []
  ? T1
  : [T1[0] & T2[0]]; // add ...MergeParams<Tail<T1>, Tail<T2>>

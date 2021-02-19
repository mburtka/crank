import {equals} from "./equals.js";

type Result = { dependencies: any[], result: unknown };
type Fn<T> = (...args: any) => T;

export function memo<T>(): ((f: Fn<T> | T, ...deps: any) => T) {
	const cache = new WeakMap<Fn<T>, Result>();
	return (f, ...deps) => {
		if (typeof f !== "function")
			return f;
		const last = cache.get(f as Fn<T>);
		if (last) {
			const {dependencies, result} = last;
			if (equals(dependencies, deps))
				return result;
		}
		const result = f.apply(null, deps);
		cache.set(f as Fn<T>, {result, dependencies: deps});
		return result;
	};
}

export function cache<TKey, TValue>(): (key: TKey) => TValue | undefined {
	const cache = new Map<TKey, TValue>();
	return (key) => cache.get(key);
}
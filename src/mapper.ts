export type Mapper<T> = MapperFunction<T> | MapperObject<T>;

type MapperFunction<T> = (key: string) => T;
type MapperObject<T> = {[key: string]: T};

export function map<T>(map: Mapper<T>, value: string) {
	return typeof map === "function"
		? map(value)
		: map[value];
}
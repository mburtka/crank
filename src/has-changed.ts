import {Default} from "./default";

export type HasChanged = ((value: any, old: any) => boolean);

export interface HasChangedMap {
	[Default]: HasChanged;
	[key: string]: HasChanged;
}

export const defaultHasChangedMap: HasChangedMap = {
	[Default]: (value, old) => value !== old,
};
import {Mapper} from "./mapper";
import {Part} from "./part";

export type HasChanged = (part: Part, updated: Set<string>, state: {}) => {shouldUpdate: boolean, args: any[]};
export type HasChangedMap = Mapper<HasChanged>;

const defaultHasChanged: HasChanged = hasChanged;

export const defaultHasChangedMap = { "": defaultHasChanged };

function hasChanged({params}: Part, updated: Set<string>, state: {}) {
	let shouldUpdate = false;
	const args = [];
	for (const param of params)
	{
		if (updated.has(param))
			shouldUpdate = true;
		args.push(state[param]);
	}
	return {shouldUpdate, args};
}
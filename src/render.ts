import {CommitterMap, defaultCommitterMap} from "./committer";
import {defaultHasChangedMap, HasChangedMap} from "./has-changed";
import {parse} from "./parse";

export type Source = HTMLTemplateElement | string;
export type Data = {} | Promise<{}>;

export type RenderOptions = {
	committers: CommitterMap,
	hasChangeds: HasChangedMap,
}

export const defaultRenderOptions: RenderOptions = {
	committers: defaultCommitterMap,
	hasChangeds: defaultHasChangedMap,
};

export const render = async (template: Source, container: Node, data: Data, options: RenderOptions = defaultRenderOptions) => {
	const clone = await parse(template, options);
	const {fragment, update} = await clone();
	update(await data);
	container.appendChild(fragment);
	return update;
};
import {defaultParseOptions} from "./defaults";
import {component, ParseOptions} from "./parse";
export {component} from "./parse";

export async function render(src: string, data: Promise<{}>, container: Node = document.body,
 	options: ParseOptions = defaultParseOptions): Promise<(data: {}) => void> {
	const clone = await component(src, options);
	const {fragment, update} = clone();
	update(await data);
	container.appendChild(fragment);
	return update;
}

import {Part} from "./part";
import {OptionMap} from "./option-map";

export type Updater = (part: Part, ...args: any) => void;

export type UpdaterMap = {
	attr: OptionMap<Updater>,
	text: OptionMap<Updater>,
};

export const defaultUpdaters: UpdaterMap = {
	attr: {"": attribute},
	text: {"": text},
};

function attribute({node, id}: Part, value: any) {
	const element = node as Element;
	if (value === undefined)
		return;
	if (value === null)
		element.removeAttribute(id);
	else if (typeof value === "boolean")
		bool(element, id, value);
	else if (Array.isArray(value))
		element.setAttribute(id, value.join(" "));
	else
		element.setAttribute(id, value);
}

function bool(element: Element, id: string, value: any) {
	const has = element.hasAttribute(id);
	if (value && !has)
		element.setAttribute(id, "");
	else if (!value && has)
		element.removeAttribute(id);
}

function text({node}: Part, value: any) {
	if (value === undefined)
		return;
	if (value === null)
		node.nodeValue = "";
	else if (Array.isArray(value))
		node.nodeValue = value.join(" ");
	else
		node.nodeValue = value;
}
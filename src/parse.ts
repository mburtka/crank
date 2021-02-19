import {Part} from "./part";
import {filter, hasChangedToken, processorToken, textMatch} from "./const";
import {Options} from "./options";
import {Updater} from "./updaters";
import {ShouldUpdate} from "./should-update";

export type ParseResult = {
	content: DocumentFragment,
	depth: number,
	parts: [number, NodeParseResult[]][],
	params: string[],
}

type NodeParseResult = Omit<Omit<Part, "node">, "component">;

export function parse(template: HTMLTemplateElement, options: Options): ParseResult {
	const {content} = template;
	const iter = document.createNodeIterator(content, filter);
	let i = 0;
	let depth = 0;
	const parts: [number, NodeParseResult[]][] = [];
	const params = new Set<string>();
	let current = iter.nextNode();
	do {
		const nodeParts = current instanceof Text
			? parseText(current, options)
			: parseElement(current as Element, options);
		if (nodeParts) {
			for (const p of nodeParts)
				for (const param of p.params)
					params.add(param);
			parts.push([i, nodeParts]);
		}
		i++;
		current = iter.nextNode();
	} while (current);
	return {content, parts, depth, params: Array.from(params)};
}

function parseElement(node: Element, options: Options): NodeParseResult[] | null {
	 let i = 0;
	 const {attributes} = node;
	 const parts = [];
	 while (i < attributes.length)
	 {
	 	const {name, value} = attributes[i];
		const result = parseAttribute(name, value, options);
		if (result)
		{
			parts.push(result);
			attributes.removeNamedItem(name);
			continue;
		}
		i++;
	 }
	 return parts.length ? parts : null;
}

function parseAttribute(name: string, value: string, {updaters: {attr}, shouldUpdates}: Options): Omit<NodeParseResult, "node"> | null {
	const [config, additional] = name.split(processorToken);
	if (additional === undefined)
		return null;
	const [s, i] = additional.split(hasChangedToken);
	const [shouldUpdate, id] = i === undefined
		? [shouldUpdates[""], s]
		: [shouldUpdates[s], i];
	const updater = attr[config];
	const params = new Set(value.split(" "));
	return {updater, params, id, shouldUpdate};
}

function parseText(node: Text, options: Options): NodeParseResult[] | null {
	const {nodeValue} = node;
	if (nodeValue === null)
		return null;
	const match = nodeValue.trim().match(textMatch);
	if (match === null)
		return null;
	const [updater, shouldUpdate, params] = processRegexMatch(match, options);
	node.nodeValue = "";
	return [{updater, shouldUpdate, params}]
}

function processRegexMatch(match: RegExpMatchArray, {updaters: {text}, shouldUpdates}: Options): [
	Updater,
	ShouldUpdate,
	Set<string>,
] {
	const [_, updater, shouldUpdate, value] = match;
	return [text[updater], shouldUpdates[shouldUpdate ?? ""], new Set(value.trim().split(" "))]
}
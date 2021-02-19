import {map} from "./mapper";
import {filter, preProcessOnly} from "./defaults";
import {AttributePart, Part} from "./part";
import {createCloneFactory, CloneFactory} from "./create-clone-factory";
import {Processor, ProcessorMap} from "./processor";
import {HasChangedMap} from "./has-changed";

const processorToken = "@";
const eventToken = "!";
const hasChangedToken = "#";

export type ParseOptions = {
	processors: ProcessorMap,
	hasChanged: HasChangedMap,
	templateImportNodeName: string,
};

export type ChildParseResult = {
	clone: CloneFactory,
	data: (d: {}) => {},
}

export type ParseResult = {
	parts: Map<number, Part[]>,
	children: Map<number, ChildParseResult>,
	params: string[],
	template: HTMLTemplateElement,
};

type Maybe<T> = T | null;

const textMatch = ((p, c) => new RegExp(`^${p}([^{${c}]*)(?:${c}([^{]*))?{([^}]+)}$`))(
	processorToken,
	hasChangedToken
);
const cache = new Map<string, CloneFactory>();

export async function component(src: string, options: ParseOptions): Promise<CloneFactory> {
	const cached = cache.get(src);
	if (cached)
		return cached;
	const template = (src.startsWith("#"))
		? templateFromId(src.substring(1))
		: await templateFromUrl(src);
	const result = await parse(template, options);
	const clone = createCloneFactory(result);
	cache.set(src, clone);
	return clone;
}

async function parse(template: HTMLTemplateElement, options: ParseOptions): Promise<ParseResult> {
	const {content} = template;
	const iter = document.createNodeIterator(content, filter);
	let current = iter.nextNode();
	let i = 0;
	const parts = new Map<number, Part[]>();
	const params = new Set<string>();
	const children = new Map<number, ChildParseResult>();
	const add = ((index: number, ps: Part[]) => {
		parts.set(index, ps);
		for (const part of ps)
		{
			const {params: maybe} = part;
			if (!maybe)
				continue;
			for (const param of maybe)
				params.add(param);
		}
	});
	const importName = options.templateImportNodeName.toLowerCase();
	do {
		const {nodeName, nodeType} = current;
		if (nodeName.toLowerCase() === importName)
		{
			const {attributes} = current as Element;
			const clone = await component(attributes["src"].value, options);
			children.set(i++, {clone, data: d => d});
		}
		else
		{
			const nodeParts = nodeType === 1
				? parseElement(current as Element, options)
				: parseText(current as Text, options);
			const isArray = Array.isArray(nodeParts);
			if (isArray && (nodeParts as AttributePart[]).length !== 0)
				add(i++, nodeParts as Part[]);
			else if (!isArray && nodeParts !== null)
				add(i++, [nodeParts as Part]);
			else
				i++;
		}
		current = iter.nextNode();
	} while (current);
	return {parts, children, params: Array.from(params), template};
}

async function templateFromUrl(src: string): Promise<HTMLTemplateElement> {
	const r = await fetch(src);
	const t = await r.text();
	const template = document.createElement("template");
	template.innerHTML = t;
	return template;
}

function templateFromId(id: string): HTMLTemplateElement {
	return document.getElementById(id) as HTMLTemplateElement;
}

function parseElement(node: Element, options): AttributePart[] {
	const {attributes} = node;
	const parts: AttributePart[] = [];
	const names = [];
	for (const attribute of attributes)
	{
		const part = parseAttribute(attribute, options);
		if (!part)
			continue;
		names.push(attribute.name);
		parts.push(Object.assign(part))
	}
	for (const name of names)
		attributes.removeNamedItem(name);
	return parts;
}

function parseAttribute({name, value}: Attr, options: ParseOptions): Part {
	return name.startsWith(eventToken)
		? parseEvent(name.substring(1), value, options)
		: parseAttributeValue(name, value, options);
}

function parseAttributeValue(name: string, value: string, {processors, hasChanged}: ParseOptions): AttributePart {
	const [config, rest] = name.split(processorToken);
	if (rest === undefined)
		return null;
	const [changeConfig, final] = rest.split(hasChangedToken);
	const [id, shouldUpdate] = final === undefined
		? [changeConfig, map(hasChanged, "")]
		: [final, map(hasChanged, changeConfig)];
	const processor = map(processors.attributes, config);
	return {id, processor, shouldUpdate, params: value.split(" ")};
}

function parseEvent(id: string, value: string, {processors: {events}, hasChanged}: ParseOptions): AttributePart {
	const config = map(events, id);
	const processor = (typeof config === "function"
		? config
		: map(config, value)) as Processor;
	return { id, processor, shouldUpdate: preProcessOnly };
}

function parseText(node: Text, {processors: {text}, hasChanged}: ParseOptions): Maybe<Part> {
	const {nodeValue} = node;
	if (nodeValue === null)
		return null;
	const value = nodeValue.trim();
	const match = value.match(textMatch);
	if (match === null)
		return null;
	const [_, config, changeConfig, content] = match;
	const shouldUpdate = map(hasChanged, changeConfig ?? "");
	const processor = map(text, config);
	node.nodeValue = "";
	return {processor, shouldUpdate, params: content.trim().split(" ")}
}
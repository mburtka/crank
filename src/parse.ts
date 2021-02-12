import {Committer, CommitterMap} from "./committer";
import {HasChanged} from "./has-changed";
import {Default, Empty} from "./default";
import {RenderOptions, Source} from "./render";

const TEXT_NODE = 3;
const ELEMENT_NODE = 1;

const filter = NodeFilter.SHOW_ELEMENT;

type Prop = {name: string, hasChanged: HasChanged};
type Props = Prop[];
type NodePartUpdater = {name: string, committer: Committer, params: string[]};
type NodeUpdater = NodePartUpdater[];
type NodeUpdaters =  {[key: number]: NodeUpdater};

type Clone = () => Promise<{fragment: DocumentFragment, update: ((data: {}) => void)}>;

type Imports = { [key: number]: (element: Element) => (() => Promise<(data: {}) => void>) };

const stateCache = new WeakMap<Node, {}>();
const cloneFactoryCache = new Map<string, Clone>();

export const parse = async (template: Source, options: RenderOptions) => {
	if (typeof template === "string")
		return template.startsWith("#")
			? await parseTemplateById(document.getElementById(template.substring(1)) as HTMLTemplateElement, options)
			: await parseUrl(template, options);
	return parseTemplateById(template, options);
};

const parseUrl = async (src: string, options: RenderOptions) => {
	const cached = cloneFactoryCache.get(src);
	if (cached !== undefined)
		return cached;
	const r = await fetch(src);
	const text = await r.text();
	const pre = document.createElement("pre");
	pre.innerHTML = text;
	const clone = await parseTemplate(pre.firstElementChild as HTMLTemplateElement, options);
	cloneFactoryCache.set(src, clone);
	return clone;
};

const parseTemplateById = async (template: HTMLTemplateElement, options: RenderOptions) => {
	const {id} = template;
	const cached = cloneFactoryCache.get(id);
	if (cached !== undefined)
		return cached;
	const clone = await parseTemplate(template, options);
	cloneFactoryCache.set(id, clone);
	return clone;
};

const parseTemplate = async (template: HTMLTemplateElement, options: RenderOptions) => {
	const {content, attributes} = template;
	const {hasChangeds, committers} = options;
	const props = [];
	for (const {name, value} of attributes) {
		if (name.startsWith("*"))
			props.push({
				name: name.substring(1),
				hasChanged: value === ""
					? hasChangeds[Default]
					: hasChangeds[value]
			});
	}
	const iter = document.createNodeIterator(content, filter);
	let current = iter.nextNode();
	let i = 0;
	const nodes = {};
	const imports = {};
	do {
		if (current.nodeName === "TEMPLATE-IMPORT") {
			imports[i++] = e => (async () => {
				const {attributes} = e;
				const map = [];
				let spread = false;
				for (const {name, value} of attributes) {
					if (!name.startsWith("*"))
						continue;
					if (name === "**")
					{
						spread = true;
						break;
					}
					else if (value === "")
						map.push([name, name]);
					else
						map.push([value, name.substring(1)]);
				}
				const clone = await parse(attributes["src"].value, options);
				const {fragment, update} = await clone();
				e.replaceWith(fragment);
				return spread ? update : d => {
					const data = {};
					for (const [from, to] of map)
						data[to] = d[from];
					update(data);
				};
			});
		} else {
			const updater = [];
			for (const [name, committer, params] of processAttributes((current as HTMLElement).attributes, committers))
				updater.push({name, committer, params});
			if (updater.length)
				nodes[i++] = updater;
		}
		current = iter.nextNode();
	} while(current);

	return cloneFactory(content, props, nodes, imports);
};

function cloneFactory(content: DocumentFragment, props: Props, nodes: NodeUpdaters,
					  imports: Imports) {
	return async () => {
		const fragment = content.cloneNode(true) as DocumentFragment;
		if (Object.keys(nodes).length === 0 && Object.keys(imports).length === 0)
			return {fragment, update: () => {}};
		const iter = document.createNodeIterator(fragment, filter);
		let i = 0;
		const elements = [];
		let current = iter.nextNode();
		const replaces = [];
		do {
			const element = current as HTMLElement;
			const replace = imports[i];
			const updater = nodes[i];
			if (replace !== undefined) {
				replaces.push(replace(element));
			}
			if (updater !== undefined) {
				elements.push({element, updater});
			}
			current = iter.nextNode();
		} while (current);
		const nested = await Promise.all(replaces.map(r => r()));
		const update = (data: {}) => {
			const changed = new Set<string>();
			const values = new Map<string, any>();
			const state = stateCache.get(fragment) || {};
			for (const {name, hasChanged} of props) {
				const value = data[name];
				if (hasChanged(value, state[name]))
					changed.add(name);
				values.set(name, value);
			}
			stateCache.set(fragment, data);
			for (const {element, updater} of elements)
				for (const {name, committer, params} of updater) {
					let update = false;
					const args = [];
					for (const param of params) {
						if (!update && changed.has(param))
							update = true;
						args.push(values.get(param));
					}
					if (update)
						committer.apply(null, [element, name, ...args]);
				}
			for (const f of nested)
				f(data);
		};
		return {fragment, update};
	}
}

function* processAttributes(attributes: NamedNodeMap, directives: CommitterMap) {
	const names = [];
	for (const attribute of attributes) {
		const {name, value} = attribute;
		if (!name.startsWith("*"))
			continue;
		names.push(name);
		const [d, n] = name.substring(1).split("!");
		yield n === undefined
			? [d, directives[Default], value.split(" ")]
			: [n, directives[d === "" ? Empty : d], value.split(" ")];
	}
	for (const name of names)
		attributes.removeNamedItem(name);
	return;
}
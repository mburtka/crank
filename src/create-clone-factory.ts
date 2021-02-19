import {ChildParseResult, ParseResult} from "./parse";
import {filter, preProcessOnly} from "./defaults";
import {AttributePart, Part} from "./part";
import {HasChanged} from "./has-changed";

export type CloneFactory = () => { fragment: DocumentFragment, update: ((data: {}) => void) };

type Updater = (state: {}, updated: Set<string>) => void;

const fragmentState = new WeakMap<DocumentFragment, {}>();
const componentState = new WeakMap<DocumentFragment, {state: any, ids: Map<string, any>}>();
const elementFragments = new WeakMap<Element, DocumentFragment>();

export function getState(element: Element, id: string = null) {

}

export function createCloneFactory({parts, children, params, template: {content}}: ParseResult ): CloneFactory {
	return () => {
		const fragment = content.cloneNode(true) as DocumentFragment;
		fragmentState.set(fragment, {});
		const iter = document.createNodeIterator(fragment, filter);
		let i = 0;
		let current = iter.nextNode();
		const updaters: Updater[] = [];
		const childUpdaters: (() => Updater)[] = [];
		do {
			const child = children.get(i);
			if (child) {
				i++;
				childUpdaters.push(createChildUpdaterFactory(current as Element, child));
			} else {
				const nodeParts = parts.get(i++);
				if (nodeParts)
					for (const part of nodeParts)
						if (part.shouldUpdate === preProcessOnly)
							preProcess(current as Element, part as AttributePart);
						else
							updaters.push(createUpdater(current, part));
			}
			current = iter.nextNode();
		} while (current);
		updaters.push(...childUpdaters.map(f => f()));
		const update = d => {
			const state = fragmentState.get(fragment);
			const updated = new Set<string>();
			for (const param of params)
			{
				const value = d[param];
				const changed = value !== state[param];
				if (changed) {
					state[param] = value;
					updated.add(param);
				}
			}
			if (updated.size === 0)
				return;
			for (const updater of updaters)
				updater(state, updated);
		};
		return {fragment, update};
	};
}

function preProcess(element: Element, {id, processor}: AttributePart) {
	const f = e => processor.call(null, e);
	element.addEventListener(id, f);
}

function createChildUpdaterFactory(element: Element, {clone, data}: ChildParseResult): (() => Updater)  {
	const {fragment, update} = clone();
	return () => {
		element.replaceWith(fragment);
		return ((state, _) => {
			update(data(state));
		});
	};
}

function createUpdater(node: Node, part: Part & { id?: string }): Updater {
	return (state, updated) => {
		const {shouldUpdate, processor, id} = part;
		const {args, shouldUpdate: update} = (shouldUpdate as HasChanged)(part, updated, state);
		if (update)
			if (id !== undefined)
				processor.apply(null, [node, id, ...args]);
			else
				processor.apply(null, [node, ...args]);
	}
}
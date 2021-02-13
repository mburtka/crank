import {ChildParseResult, ParseResult} from "./parse";
import {filter} from "./defaults";
import {Part} from "./part";

export type CloneFactory = () => { fragment: DocumentFragment, update: ((data: {}) => void) };

type Updater = (state: {}, updated: Set<string>) => void;

const fragmentState = new WeakMap<DocumentFragment, {}>();

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
				const changed = shouldUpdate(value, state[param]);
				if (changed) {
					state[param] = value;
					updated.add(param);
				}
			}
			if (updated.size === 0)
				return;
			fragmentState.set(fragment, state);
			for (const updater of updaters)
				updater(state, updated);
		};
		return {fragment, update};
	};
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

type MaybeIdPart = Part & { id?: string }
function createUpdater(node: Node, part: MaybeIdPart): Updater {
	return (state, updated) => {
		const {shouldUpdate, processor, id} = part;
		const {args, shouldUpdate: update} = shouldUpdate(part, updated, state);
		if (update)
			if (id !== undefined)
				processor.apply(null, [node, id, ...args]);
			else
				processor.apply(null, [node, ...args]);
	}
}

function shouldUpdate(value: any, old: any) {
	return value !== old;
}
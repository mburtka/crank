import {ParseResult} from "./parse";
import {Part} from "./part";

export function createCloneFactory({content, depth, params, parts: indexes}: ParseResult) {
	const clone = () => {
		const fragment = content.cloneNode(true) as DocumentFragment;
		const iter = document.createNodeIterator(fragment);
		let current = iter.nextNode();
		let j = 0;
		const parts: Part[] = [];
		for (let i = 0; i < indexes.length; i++) {
			const [index, nodeParts] = indexes[i];
			while (j++ !== index)
				current = iter.nextNode();
			for (const np of nodeParts) {
				const part: Part = {component: fragment, node: current as Element, ...np};
				parts.push(part);
			}
		}
		return parts;
	};
	return clone;
}
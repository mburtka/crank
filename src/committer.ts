import {Default, Empty} from "./default";

export type Committer = ((element: HTMLElement, name: string, ...args: any[]) => void);

export interface CommitterMap {
	[Default]: Committer;
	[Empty]: Committer;
	[key: string]: Committer;
}

const bool: Committer = (e, n, v) => {
	const has = e.hasAttribute(n);
	if (v && !has)
		e.setAttribute(n, "");
	else if (!v && has)
		e.removeAttribute(n);
};

const str: Committer = (e, n, v) => {
	if (v === null && e.hasAttribute(n))
		e.removeAttribute(n);
	else
		e.setAttribute(n, v);
};

const def: Committer = (e, n, v) => {
	if (v === undefined)
		return;
	if (typeof v === "boolean")
		bool(e, n, v);
	else
		str(e, n, v);
};

const text: Committer = (e, _, v) => {
	if (v !== null && v !== undefined)
		e.innerText = v;
};

export const defaultCommitterMap: CommitterMap = {
	[Default]: def,
	[Empty]: text,
};
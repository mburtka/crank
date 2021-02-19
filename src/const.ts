export const filter = NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT;

export const processorToken = "@";
export const hasChangedToken = "#";

export const textMatch = ((p, c) => new RegExp(`^${p}([^{${c}]*)(?:${c}([^{]*))?{([^}]+)}$`))(
	processorToken,
	hasChangedToken
);
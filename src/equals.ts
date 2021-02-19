export function equals(x: any, y: any): boolean {
	return Object.is(x,y) ||
		(Array.isArray(x) && Array.isArray(y) && arrayEquals(x, y)) ||
		(typeof x === "object" && typeof y === "object" && objectEquals(x,y))
}

function arrayEquals(x: any[], y: any[]): boolean {
	const {length} = x;
	if (length !== y.length)
		return false;
	for (let i = 0; i < length; i++)
		if (!equals(x[i],y[i]))
			return false;
	return true;
}

function objectEquals(x: {}, y: {}): boolean {
	for (const [key, value] of Object.entries(x))
		if (!equals(value, y[key]))
			return false;
	return true;
}
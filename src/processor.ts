import {Mapper} from "./mapper.js";

export type ProcessorMap = {
	attributes: Mapper<Processor>,
	text: Mapper<Processor>,
	events: Mapper<Mapper<EventProcessor> | EventProcessor>,
};

export type Processor = ValueProcessor | EventProcessor;

export const defaultProcessors: ProcessorMap = {
	attributes: {
		"": attribute,
		multi: (e, i, one, two) => e.setAttribute(i, `${one} ${two}`),
		arr: (e, i, a) => e.setAttribute(i, a.join(" ")),
	},
	events: {},
	text: {
		"": text,
	}
};

type ValueProcessor = AttributeProcessor | TextProcessor;

type EventProcessor = (event: Event) => void;

type AttributeProcessor = (element: Element, id: string, ...values: any[]) => void;
type TextProcessor = (text: Text, ...values: any[]) => void;

function text(text: Text, value: any) {
	if (value === undefined)
		return;
	if (value === null)
		text.nodeValue = "";
	else if (Array.isArray(value))
		text.nodeValue = value.join(" ");
	else
		text.nodeValue = value;
}

function attribute(element: Element, id: string, value: any) {
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
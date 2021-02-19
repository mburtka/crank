import {Processor} from "./processor";
import {HasChanged} from "./has-changed";

export interface Part {
	processor: Processor,
	params?: string[],
	shouldUpdate: HasChanged | Symbol,
}

export interface AttributePart extends Part {
	id: string,
}
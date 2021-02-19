import {Component} from "./component"
import {Updater} from "./updaters";
import {ShouldUpdate} from "./should-update";

export type Part = {
	component: Component,
	node: Element | Text,
	updater: Updater,
	shouldUpdate: ShouldUpdate,
	id?: string,
	params?: Set<string>,
}
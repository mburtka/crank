import {StateFactoryMap} from "./state";
import {defaultUpdaters, UpdaterMap} from "./updaters";
import {ListenerMap} from "./listener";
import {defaultShouldUpdates, ShouldUpdateMap} from "./should-update";

export type Options = {
	listeners?: ListenerMap,
	stateFactories?: StateFactoryMap,
	updaters: UpdaterMap,
	shouldUpdates: ShouldUpdateMap,
}

export const defaultOptions: Options = {
	updaters: defaultUpdaters,
	shouldUpdates: defaultShouldUpdates,
};
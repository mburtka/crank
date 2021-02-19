import {OptionMap} from "./option-map";
import {equals} from "./equals";

export type ShouldUpdate = (old: any, args: any) => boolean;

export type ShouldUpdateMap = OptionMap<ShouldUpdate>;

export const defaultShouldUpdates: ShouldUpdateMap = {
	"": (o, v) => equals(o, v),
};
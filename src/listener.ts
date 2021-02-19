import {Part} from "./part";
import {OptionMap} from "./option-map";

type Listener = (part: Part, event: Event) => void;

export type ListenerMap = OptionMap<Listener>;
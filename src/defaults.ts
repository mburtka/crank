import {ParseOptions} from "./parse";
import {defaultProcessors} from "./processor";
import {defaultHasChangedMap} from "./has-changed";

const defaultTemplateImportNodeName = "t-i";

export const filter = NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT;
export const defaultParseOptions: ParseOptions = {
	processors: defaultProcessors,
	hasChanged: defaultHasChangedMap,
	templateImportNodeName: defaultTemplateImportNodeName,
};
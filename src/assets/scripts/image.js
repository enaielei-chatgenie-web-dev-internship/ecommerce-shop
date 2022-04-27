import {Record, Rel} from "@/assets/scripts/table.js";

export default class Image extends Record {
    constructor(path, label="") {
        super(path=path, label=label);
    }
}

Image.init();
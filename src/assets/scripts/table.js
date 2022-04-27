const _classes = [];
let _tables = {};

export function setTables(value) {
    _tables = value;
}

export function pluralize(str) {
    if(str.endsWith("s"))
        return str + "es"
    
    return str + "s"
}

export const pl = pluralize

export const Relationship = {
    ONE: 0,
    MANY: 1
}

export const Rel = Relationship;

export class Record {
    constructor(properties={}) {
        for(let k in this.cls._relationships) {
            let prop = this.cls._relationships[k];
            if(prop instanceof Function) this[k] = prop;
            else Object.defineProperty(this, k, prop);
        }
        this.update(properties);
    }

    create() {
        if(this.existing) return this;
        let cls = this.cls;
        if(cls == undefined) return;
        let records = cls._get;
        this._id = cls.nextId;
        records.push(this);

        return records[records.length - 1];
    }

    update(properties={}) {
        for(let k in properties) {
            this[k] = properties[k];
        }

        return this;
    }

    delete() {
        if(!this.existing) return this;
        let records = this.cls._get;
        while(records.includes(this)) {
            records.splice(records.indexOf(this), 1);
        }
        this._id = 0;

        return this;
    }

    get existing() {
        let cls = this.cls;
        if(cls == undefined) return false;
        else if(cls._get.length == 0) return false;
        let uniques = cls.uniques;
        let vals = uniques.map((e) => {
            if(!(e instanceof Array)) e = [e];
            let props = {};
            for(let prop of e) props[prop] = this[prop];
            let first = cls.getFirst(props);
            return first != null;
        });
        return vals.some((r) => r);
    }

    get cls() {
        return _classes.find((c) => c.name == this.constructor.name);
    }

    get id() {
        return "_id" in this ? this._id : 0;
    }

    static get _get() {
        let key = pl(this.name.toLowerCase());
        if(!(key in _tables)) _tables[key] = [];

        return _tables[key];
    }

    static get uniques() {
        let key = "_uniques";
        if(!(key in this)) this[key] = [];
        let uniques = this[key];
        if(!uniques.includes("id")) uniques.splice(0, 0, "id");

        return uniques;
    }

    static get _relationships() {
        let key = "_relationship_definitions";
        if(!(key in this)) this[key] = [];

        return this[key];
    }

    static get minId() {
        let records = this._get;
        if(records.length == 0) return 0;
        return Math.min(...records.map((r) => r.id));
    }

    static get maxId() {
        let records = this._get;
        if(records.length == 0) return 0;
        return Math.max(...records.map((r) => r.id));
    }

    static get nextId() {
        return this.maxId + 1;
    }

    static init(...uniques) {
        if(!_classes.includes(this)) _classes.push(this);
        this.uniques.length = 0;
        this.uniques.push(...uniques);
    }

    static get first() {return this.getFirst();}

    static get last() {return this.getFirst();}

    static getFirst(kwargs={}) {
        let get = this.get(kwargs);
        return get.length == 0 ? null : get[0];
    }

    static getLast(kwargs={}) {
        let get = this.get(kwargs);
        return get.length == 0 ? null : get[get.length - 1];
    }

    static get(kwargs={}) {
        function popProp(key) {
            let val = null;
            if(key in kwargs) {
                val = kwargs[key];
                delete kwargs[key];
            }
            return val;
        }

        let condition = popProp("_condition") || "and";
        let sort = popProp("_sort");
        let reverse = popProp("_reverse") || false;
        let skip = popProp("_skip");
        let limit = popProp("_limit");

        let records = this._get;
        let keys = Object.getOwnPropertyNames(kwargs);
        let filter = null;
        let cloned = false;
        if(keys.length != 0) {
            if(!(condition instanceof Function)) {
                function getProp(key, props=kwargs) {
                    let val = key in props ? props[key] : null;
                    if(val instanceof Function) val = val();

                    return val;
                }
                filter = (record, i, a, cond=condition, props=kwargs) => {
                    let keys = Object.getOwnPropertyNames(props);
                    let res = keys.map((v) => {
                        if(v in record) {
                            let prop = getProp(v);
                            return record[v] == prop;
                        }

                        return false;
                    });
                    if(cond == "and") return res.every((v) => v);
                    else if(cond == "or") return res.some((v) => v);

                    return false;
                }
            } else filter = condition

            if(filter != null) {
                cloned = true;
                records = Array.from(records).filter(filter);
            }
        }

        if(sort instanceof String) {
            sort = (x, y, prop=sort) => {
                return x[prop] - y[prop];
            }
        }

        if(sort instanceof Function) {
            if(!cloned) {
                records = Array.from(records);
                cloned = true;
            }
            records.sort(sort);
        }

        if(reverse) {
            if(!cloned) {
                records = Array.from(records);
                cloned = true;
            }
            records.reverse();
        }

        if(skip != null) {
            if(!cloned) {
                records = Array.from(records);
                cloned = true;
            }
            skip = Math.max(Math.min(skip, records.length), 0);
            records.splice(0, skip);
        }

        if(limit != null) {
            if(!cloned) {
                records = Array.from(records);
                cloned = true;
            }
            limit = Math.max(Math.min(limit, records.length), 0);
            records.length = limit;
        }

        return records;
    }

    static relate(tcls, type=Rel.ONE, name=null, idName=null, targetIdName=null) {
        let fname = this.name.toLowerCase();
        let tname = tcls.name.toLowerCase();
        let id = idName || `${fname}Id`
        
        if(type == Rel.MANY) {
            name = name || pl(tname);
            this._relationships[name] = function get(sort=null, reverse=false, _tcls=tcls) {
                return _tcls.get({_sort: sort, _reverse: reverse, ...{[id]: this.id}});
            }
        } else if(type == Rel.ONE) {
            name = name || tname;
            let tid = targetIdName || `${name}Id`;
            let pname = `_${tid}`;
            this._relationships[name] = {
                get(_tcls=tcls, _tid=tid) {
                    if(_tid in this) {
                        let first = _tcls.getFirst({id: this[_tid]});
                        return first;
                    }
    
                    return null;
                },
                set(value, _tcls=tcls, _tid=tid) {
                    if(value instanceof _tcls) this[_tid] = value.id;
                    else this[_tid] = 0;
                }
            };
            
            this._relationships[tid] = {
                get(_pname=pname) {
                    if(_pname in this) return this[_pname];
                    return 0;
                },
                set(value, _pname=pname, _tid=tid) {
                    if(value === parseInt(value, 10)) this[_pname] = value;
                    else this[_tid] = 0;
                }
            };
        }

        return this;
    }
}
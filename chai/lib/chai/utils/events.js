/*!
 * chai - utilidade events
 * 
 * copyright (c) 2025 cavassani
 * 
 * licença mit
 */

// instância eventtarget global
export const events = new EventTarget();

export class PluginEvent extends Event {
    constructor(type, name, fn) {
        super(type);

        this.name = String(name);
        this.fn = fn;
    }
}
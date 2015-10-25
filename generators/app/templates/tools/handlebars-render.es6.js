import {readFile} from 'fs';
import {join} from 'path';
import yaml from 'yamljs';
import glob from 'glob';
import handlebars from 'handlebars';
import extendHbs from '../server/hbsExtend.es6.js';

const defaultOptions = {
    templateOptions: {},
    viewPath: '',
    dataPath: [],
    layoutsPath: [],
    partialsPath: [],
    blockHelperName: 'block',
    contentHelperName: 'contentFor',
    extname: '.hbs',
    defaultLayout: ''
};

const parseRe = /\-{3,3}([\S\s]+)\-{3,3}/i;
const parseYaml = (content) => {
    let res = parseRe.exec(content);
    return res ? {
        yaml: yaml.parse(res[1]),
        content: content.slice(res[0].length)
    } : {
        content: content
    };
};

const read = (filename) => {
    return new Promise((resolve, reject) => {
        readFile(filename, {
            encoding: 'utf8'
        }, (err, data) => err ? reject(err) : resolve(data));
    });
};
const readDir = (root, filename = '*', extname = '.*') => {
    return new Promise((resolve, reject) => {
        glob('**/' + filename + extname, {
            cwd: root
        }, (err, data) => {
            return err ? reject(err) : resolve(data);
        });
    });
};

class Hbs {
    constructor() {
        this.handlebars = handlebars.create();
    };

    registerHelper(...args) {
        this.handlebars.registerHelper(...args);
    };

    registerPartial(...args) {
        this.handlebars.registerPartial(...args);
    };

    async registerPartials() {
        this.partialsPath = [].concat(this.partialsPath);

        try {
            let dirList = await Promise.all(this.partialsPath.map((root) => readDir(root, '*', this.extname)));
            let files = [];
            let names = [];

            if (!dirList.length) {
                return;
            }

            // Generate list of files and template names
            dirList.forEach((dir, i) => {
                dir.forEach((file) => {
                    files.push(join(this.partialsPath[i], file));
                    names.push(file.slice(0, -1 * this.extname.length));
                });
            });
            // Read all the partial from disk
            let partials = await Promise.all(files.map(read));

            for (let i = 0; i !== partials.length; i++) {
                this.registerPartial(names[i], partials[i]);
            }

            this.partialsRegistered = true;
        } catch (e) {
            console.error('Error caught while registering partials');
            console.error(e.stack);
        }
    };

    getLayoutPath(layout) {
        return join(this.layoutsPath ? this.layoutsPath : this.viewPath, layout + this.extname);
    };

    async loadLayoutFile(layout) {
        return await read(this.getLayoutPath(layout));
    };

    // load data for template
    async loadTemplateData(template, dataFilename = template) {
        if (this.data[template]) {
            return this.data[template];
        }
        try {
            let dirList = await * this.dataPath.map((root) => readDir(root, dataFilename, '.*'));
            let files = [];
            let names = [];

            if (!dirList.length) {
                return;
            }
            
            // Generate list of files and template names
            dirList.forEach((dir, i) => {
                dir.length && dir.forEach((file) => {
                    files.push(join(this.dataPath[i], file));
                    names.push(file.replace(/\.\S+$/, ''));
                });
            });

            if (!files.length) {
                return;
            }

            // Read all data of the template from disk
            let data = await * files.slice(0, 1).map(read);

            // but only use the first one
            if (data.length > 1) {
                console.warn(`Warn: data file for ${template} is more than one.`);
            }
            data = (data + '').replace(/\s*\/\/.*?([\n\r]+|$)/g, '').replace(/\s*\/\*[\s\S]*?\*\//g, '');
            this.data[template] = JSON.parse(data);
            return this.data[template];
        } catch (e) {
            console.error('Error caught while load and compile template data.');
            console.error(e);
        }
    };

    async cacheLayout(layout) {
        // Create a default layout to always use
        if (!layout && !this.defaultLayout) {
            return this.handlebars.compile('{{{body}}}');
        }

        // Compile the default layout if one not passed
        if (!layout) {
            layout = this.defaultLayout;
        }

        let layoutTemplate;
        try {
            let rawLayout = await this.loadLayoutFile(layout);
            layoutTemplate = this.handlebars.compile(rawLayout);
        } catch (err) {
            console.error(err.stack);
        }

        return layoutTemplate;
    };

    block(name) {
        // val = block.toString
        let val = (this.blocks[name] || []).join('\n');

        // clear the block
        this.blocks[name] = [];
        return val;
    };

    content(name, options, context) {
        // fetch block
        let block = this.blocks[name] || (this.blocks[name] = []);

        // render block and save for layout render
        block.push(options.fn(context));
    };

    configure(options) {
        let self = this;
        options = options || {};

        if (!options.viewPath) {
            throw new Error('must specify view path');
        }

        Object.assign(this, defaultOptions, options);

        // Cache templates and layouts, and templates data
        this.cache = {};
        this.blocks = {};
        this.data = {};

        this.dataPath = [].concat(this.dataPath);
        this.partialRegistered = false;

        // block helper
        this.registerHelper(this.blockHelperName, function(name, options) {
            return self.block(name) || options.fn(this);
        });

        // contentFor helper
        this.registerHelper(this.contentHelperName, function(name, options) {
            return self.content(name, options, this);
        });

        return this;
    };

    async render(tpl, locals) {
        let tplPath = join(this.viewPath, tpl + this.extname);
        let template, rawTemplate, layoutTemplate, parsed;

        locals = locals || {};
        Object.assign(locals, this.locals, this.state);

        // load partials
        if (!this.partialsRegistered) {
            await this.registerPartials();
        }

        // load default layout
        if (!this.layoutTemplate) {
            this.layoutTemplate = await this.cacheLayout();
        }

        // Load the template
        if (this.disableCache || !this.cache[tpl]) {
            rawTemplate = await read(tplPath);

            // parse yaml settings
            parsed = parseYaml(rawTemplate);

            this.cache[tpl] = {
                template: this.handlebars.compile(parsed.content)
            };

            let yaml = parsed.yaml;
            let dataFile = yaml && yaml.data;
            let layout = yaml && yaml.layout;
            let data;
            if (layout != null) {
                let rawLayout = layout === false ? '{{{body}}}' : await this.loadLayoutFile(layout);
                this.cache[tpl].layoutTemplate = this.handlebars.compile(rawLayout);
            }
            if (dataFile !== false) {
                data = await this.loadTemplateData(tpl, dataFile || tpl);
            }
            // extend parsed yaml and dataFile's data to template data
            Object.assign(locals, data, parsed.yaml);
        }

        template = this.cache[tpl].template;
        layoutTemplate = this.cache[tpl].layoutTemplate || this.layoutTemplate;

        // Add the current koa context to templateOptions.data to provide access
        // to the request within helpers.
        if (!this.templateOptions.data) {
            this.templateOptions.data = {};
        }

        // Run the compiled templates
        locals.body = template(locals, this.templateOptions);
        return layoutTemplate(locals, this.templateOptions);
    };
}

const create = () => new Hbs();
const instance = create();
extendHbs(instance);

export default instance;
export {create};

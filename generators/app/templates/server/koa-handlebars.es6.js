import fs from 'fs';
import path from 'path';
import glob from 'glob';
import handlebars from 'handlebars';
import yaml from 'yamljs';

const defaultSetting = {
    templateOptions: {},
    dataPath: [],
    partialsPath: [],
    blockHelperName: 'block',
    contentHelperName: 'contentFor',
    extname: '.hbs',
    defaultLayout: '',
    disableCache: false
};

const read = (filename) => {
    return (done) => {
        fs.readFile(filename, {
            encoding: 'utf8'
        }, done);
    };
};

const readDir = (root, filename = '*', extname = '.*') => {
    return (done) => glob('**/' + filename + extname, {
        cwd: root
    }, done);
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

    registerPartials() {
        let self = this;
        this.partialsPath = [].concat(this.partialsPath);

        return function * () {
            try {
                let dirList = yield self.partialsPath.map((root) => readDir(root, '*', this.extname));
                let files = [];
                let names = [];

                if (!dirList.length) {
                    return;
                }
                
                // Generate list of files and template names
                dirList.forEach((dir, i) => {
                    dir.forEach((file) => {
                        files.push(path.join(self.partialsPath[i], file));
                        names.push(file.slice(0, -1 * self.extname.length));
                    });
                });

                // Read all the partial from disk
                let partials = yield files.map(read);

                for (let i = 0; i !== partials.length; i++) {
                    self.registerPartial(names[i], partials[i]);
                }

                self.partialsRegistered = true;
            } catch (e) {
                console.error('Error caught while registering partials');
                console.error(e);
            }
        };
    };

    getLayoutPath(layout) {
        return path.join(this.layoutsPath ? this.layoutsPath : this.viewPath, layout + this.extname);
    };

    loadLayoutFile(layout) {
        return (done) => {
            read(this.getLayoutPath(layout))(done);
        };
    };

    // load data for template
    loadTemplateData(template, dataFilename = template) {
        let self = this;

        if (this.data[template]) {
            return this.data[template];
        }
        return function * () {
            try {
                let dirList = yield self.dataPath.map((root) => readDir(root, dataFilename, '.*'));
                let files = [];
                let names = [];

                if (!dirList.length) {
                    return;
                }
                
                // Generate list of files and template names
                dirList.forEach((dir, i) => {
                    dir.forEach((file) => {
                        files.push(path.join(self.dataPath[i], file));
                        names.push(file.replace(/\.\S+$/, ''));
                    });
                });

                // Read all data of the template from disk
                let data = yield files.slice(0, 1).map(read);

                // but only use the first one
                if (data.length > 1) {
                    console.warn(`Warn: data file for ${template} is more than one.`);
                }
                data = (data + '').replace(/\s*\/\/.*?([\n\r]+|$)/g, '').replace(/\s*\/\*[\s\S]*?\*\//g, '');
                self.data[template] = JSON.parse(data);
                return self.data[template];
            } catch (e) {
                console.error('Error caught while load and compile template data.\nIt\'s ok to ignore this error.');
            }
        };
    };

    cacheLayout(layout) {
        let hbs = this;
        return function * () {
            // Create a default layout to always use
            if (!layout && !hbs.defaultLayout) {
                return hbs.handlebars.compile('{{{body}}}');
            }

            // Compile the default layout if one not passed
            if (!layout) {
                layout = hbs.defaultLayout;
            }

            let layoutTemplate;
            try {
                let rawLayout = yield hbs.loadLayoutFile(layout);
                layoutTemplate = hbs.handlebars.compile(rawLayout);
            } catch (err) {
                console.error(err.stack);
            }

            return layoutTemplate;
        };
    };

    /**
     * block helper delegates to this function to retreive content
     */
    block(name) {
        // val = block.toString
        let val = (this.blocks[name] || []).join('\n');

        // clear the block
        this.blocks[name] = [];
        return val;
    };

    /**
     * The contentFor helper delegates to here to populate block content
     */
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

        Object.assign(this, defaultSetting, options);

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

    middleware(options) {
        this.configure(options);

        let render = this.createRenderer();

        return function * (next) {
            this.render = render;
            yield * next;
        };
    };

    createRenderer() {
        let hbs = this;
        return function * (tpl, locals) {
            let tplPath = path.join(hbs.viewPath, tpl + hbs.extname);
            let template, rawTemplate, layoutTemplate, parsed;

            locals = locals || {};
            Object.assign(locals, hbs.locals, this.state);

            // load partials
            if (!hbs.partialsRegistered) {
                yield hbs.registerPartials();
            }

            // load default layout
            if (!hbs.layoutTemplate) {
                hbs.layoutTemplate = yield hbs.cacheLayout();
            }

            // Load the template
            if (hbs.disableCache || !hbs.cache[tpl]) {
                rawTemplate = yield read(tplPath);

                // parse yaml settings
                parsed = parseYaml(rawTemplate);

                hbs.cache[tpl] = {
                    // template: hbs.handlebars.compile(rawTemplate)
                    template: hbs.handlebars.compile(parsed.content)
                };

                let yaml = parsed.yaml;
                let dataFile = yaml && yaml.data;
                let layout = yaml && yaml.layout;
                let data;
                if (layout != null) {
                    let rawLayout = layout === false ? '{{{body}}}' : yield hbs.loadLayoutFile(layout);
                    hbs.cache[tpl].layoutTemplate = hbs.handlebars.compile(rawLayout);
                }
                if (dataFile !== false) {
                    data = yield hbs.loadTemplateData(tpl, dataFile || tpl);
                }
                // extend parsed yaml and dataFile's data to template data
                Object.assign(locals, data, parsed.yaml);
            }

            template = hbs.cache[tpl].template;
            layoutTemplate = hbs.cache[tpl].layoutTemplate || hbs.layoutTemplate;

            // Add the current koa context to templateOptions.data to provide access
            // to the request within helpers.
            if (!hbs.templateOptions.data) {
                hbs.templateOptions.data = {};
            }

            hbs.templateOptions.data = Object.assign(hbs.templateOptions.data, {
                koa: this
            });

            // Run the compiled templates
            locals.body = template(locals, hbs.templateOptions);
            this.body = layoutTemplate(locals, hbs.templateOptions);
        };
    };
}

const create = () => new Hbs();

export default new Hbs();
export {create};

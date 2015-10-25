import {relative} from 'path';
import through from 'through2';
import gutil from 'gulp-util';
import hbs from './handlebars-render.es6';

const PLUGIN_NAME = 'gulp-handlebars';

const compile = (opts = {}) => {
    hbs.configure(opts);
    return through.obj(function(file, enc, cb) {
        if (file.isNull()) {
            cb(null, file);
            return;
        }
        if (file.isStream()) {
            cb(new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported'));
            return;
        }

        let tplName = relative(file.base, file.path).replace(/\.\S+$/, '');
        let rendered = hbs.render(tplName);
        try {
            rendered.then((data) => {
                file.contents = new Buffer(data);
                this.push(file);
                cb();
            }, (err) => {
                gutil.log(gutil.colors.cyan(PLUGIN_NAME), `Handlebars compile error. ${err}`);
                cb(err);
            });
        } catch (err) {
            this.emit('error', new gutil.PluginError(PLUGIN_NAME, err));
            cb(err);
        }
    });
};

export default compile;

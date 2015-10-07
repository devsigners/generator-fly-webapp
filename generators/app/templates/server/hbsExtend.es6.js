'use strict';

/// hbs extension
const extendHbs = (hbs) => {
    // inject some helpers to hbs.

    // json
    hbs.registerHelper('json', function(arg) {
        return arg == null ? '' : new hbs.SafeString(JSON.stringify(arg));
    });
};

export default extendHbs;

// hbs extension
const extendHbs = (hbs) => {
    // inject some helpers to hbs.

    // json
    hbs.registerHelper('json', function(data, options) {
        let text = data == null ? '' : JSON.stringify(data);
        return options.fn({text});
    });
};

export default extendHbs;

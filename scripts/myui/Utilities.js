var Utilities = {

    /**
     * Returns window height
     */
    getWindowHeight : function() {
        return([
            window.innerHeight ? window.innerHeight : null,
            document.documentElement ? document.documentElement.clientHeight : null,
            document.body ? document.body.clientHeight : null
        ].select(function(height) {
            return height > 0
        }).first() || 0);
    },

    /**
     * Returns window scroll top
     */
    getWindowScrollTop : function() {
        return ([
            window.pageYOffset ? window.pageYOffset : null,
            document.documentElement ? document.documentElement.scrollTop : null,
            document.body ? document.body.scrollTop : null
        ].select(function(scrollTop) {
            return scrollTop > 0
        }).first() || 0);
    },

    /**
     * Returns the closest number as the result of using i as a multiplication factor
     *
     * @param n limit number
     * @param i factor number
     */
    floorToInterval : function(n, i) {
        return Math.floor(n / i) * i;
    }
};

Element.buildAndAppend = function(type, options, style) {
    var newElement = $(document.createElement(type));
    $H(options).each(function(pair) {
        newElement[pair.key] = pair.value
    });
    if (style) newElement.setStyle(style);
    return newElement;
};

Element.addMethods({
    purgeChildren: function(element) {
        $A(element.childNodes).each(function(e) {
            $(e).remove();
        });
    },
    build: function(element, type, options, style) {
        var newElement = Element.buildAndAppend(type, options, style);
        element.appendChild(newElement);
        return newElement;
    }
});

var SelectBox = Class.create();

SelectBox.prototype = {
    initialize: function(parent_element, values, html_options, style_options) {
        this.element = $(parent_element).build("select", html_options, style_options);
        this.populate(values);
    },

    populate: function(values) {
        this.element.purgeChildren();
        var that = this;
        $A(values).each(function(pair) {
            if (typeof(pair) != "object") {
                pair = [pair, pair]
            }
            that.element.build("option", { value: pair[1], innerHTML: pair[0]})
        });
    },

    setValue: function(value) {
        var e = this.element;
        var matched = false;
        $R(0, e.options.length - 1).each(function(i) {
            if (e.options[i].value == value.toString()) {
                e.selectedIndex = i;
                matched = true;
            }
        });
        return matched;
    },

    getValue: function() {
        return $F(this.element)
    }
};
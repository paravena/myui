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

var SelectBox = Class.create({
    initialize: function(parentElement, values, htmlOptions, styleOptions) {
        this.element = new Element('select', htmlOptions);
        this.element.setStyle(styleOptions);
        $(parentElement).insert(this.element);

        this.populate(values);
    },

    populate: function(values) {
        this.element.innerHTML = '';
        var self = this;
        $A(values).each(function(pair) {
            if (typeof(pair) != "object") {
                pair = [pair, pair]
            }
            self.element.insert(new Element('option', {value: pair[1]}).update(pair[0]));
        });
    },

    setValue: function(value) {
        var se = this.element;
        var matched = false;
        $R(0, se.options.length - 1).each(function(i) {
            if (se.options[i].value == value.toString()) {
                se.selectedIndex = i;
                matched = true;
            }
        });
        return matched;
    },

    getValue: function() {
        return $F(this.element);
    }
});
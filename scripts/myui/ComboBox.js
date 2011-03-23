/**
 * ComboBox control
 */
MY.ComboBox = Class.create(MY.Autocompleter, {
    initialize : function(element, options) {
        this.baseInitialize(element, options);
        this.options.minChars = this.options.minChars || 0;
        var self = this;
        this.element.on('keydown', this._keyPress.bindAsEventListener(this));
        this.options.all = function(instance) {
            var currentValue = instance.element.value.strip();
            var result = [];
            var text = '';
            var value = '';
            var items = instance.options.items;
            var listTextPropertyName = instance.options.listTextPropertyName;
            var listValuePropertyName = instance.options.listValuePropertyName;
            for (var i = 0; i < items.length; i++) {
                if (typeof(items[i]) == 'object') {
                    text = items[i][listTextPropertyName];
                    value = items[i][listValuePropertyName];
                } else {
                    text = items[i];
                    value = items[i];
                }
                if (currentValue == text) instance.index = i;
                result.push('<li id="' + value + '">' + text + '</li>');
            }
            return '<ul>' + result.join('') + '</ul>';
        };
    },

    _keyPress : function(event) {
        if (event.keyCode == Event.KEY_DOWN) {
            this.showAll();
            event.stop();
        }
    },

    showAll : function() {
        if (!this.active) {
            this.hasFocus = true;
            this.getAllChoices();
            this.element.focus();
            this.element.select();
            if (this.index >= 0)
                this.getEntry(this.index).scrollIntoView(true);
        } else {
            this.options.onHide(this.element, this.update);
        }
    },

    getAllChoices : function() {
        this.updateChoices(this.options.all(this));
    },

    decorate : function(element) {
        var width = element.getDimensions().width;
        var height = element.getDimensions().height;
        Element.wrap(element, 'span', {width : width + 'px'}); // auto complete container
        element.setStyle({width : (width - 24)+'px', height: (height - 5)+'px'});
        var container = element.up();
        container.addClassName("acContainer");
        container.id = this.id + '_container';
        var cbBtn = new Element('span');
        cbBtn.addClassName('cbBtn');
        container.insert(cbBtn);
        Event.observe(cbBtn, 'click', this.showAll.bindAsEventListener(this));
        container.insert('<div id="'+this.id+'_update" class="autocomplete shadow"></div>');
        element.value = this.options.initialText;
    }
    /*
    onKeyPress: function(event) {
        if (this.active) {
            switch (event.keyCode) {
                case Event.KEY_TAB:
                case Event.KEY_RETURN:
                    this.selectEntry();
                    event.stop();
                case Event.KEY_ESC:
                    this.hide();
                    this.active = false;
                    event.stop();
                    return;
                case Event.KEY_LEFT:
                case Event.KEY_RIGHT:
                    return;
                case Event.KEY_UP:
                    this.markPrevious();
                    this.render();
                    event.stop();
                    return;
                case Event.KEY_DOWN:
                    this.markNext();
                    this.render();
                    event.stop();
                    return;
            }
        } else if (event.keyCode == Event.KEY_DOWN) {
            this.showAll();
            return;
        } else if (event.keyCode == Event.KEY_TAB || event.keyCode == Event.KEY_RETURN || (Prototype.Browser.WebKit > 0 && event.keyCode == 0)) {
            return;
        }
        this.changed = true;
        this.hasFocus = true;
        if (this.observer) clearTimeout(this.observer);
        this.observer = setTimeout(this.onObserverEvent.bind(this), this.options.frequency * 1000);
    }
    */
});


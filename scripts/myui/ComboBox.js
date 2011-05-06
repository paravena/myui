/**
 * ComboBox control
 */
MY.ComboBox = Class.create(MY.Autocompleter, {
    initialize : function(element, options) {
        this.baseInitialize(element, options);
        this.options.minChars = this.options.minChars || 0;
        this.element.on('keydown', this._keyPress.bindAsEventListener(this));
        this.options.all = function(instance) {
            var currentValue = instance.element.value.strip();
            var result = [];
            var text = '';
            var value = '';
            var items = [];
            if (instance.options.items) {
                items = instance.options.items;
            } else if (instance.options.url) {
                new Ajax.Request(instance.options.url, {
                    onSuccess: function(transport) {
                        items = transport.responseText.evalJSON();
                    },
                    asynchronous: false
                })
            }
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
        if (event.keyCode == Event.KEY_DOWN && !this.active) {
            this.changed = false;
            this.showAll();
            event.stop();
        }
    },

    showAll : function() {
        if (!this.active) {
            this.element.focus();
            this.element.select();
            this.hasFocus = true;
            this.active = true;
            this.getAllChoices();
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
        element.setStyle({width : (width - 22)+'px'});
        var container = element.up();
        container.addClassName('my-autocompleter');
        container.id = this.id + '_container';
        var comboBoxBtn = new Element('span');
        comboBoxBtn.addClassName('my-combobox-button gradient');
        container.insert(comboBoxBtn);
        comboBoxBtn.on('click', this.showAll.bindAsEventListener(this));
        if (this.options.listId == null)
            container.insert({after: '<div id="'+this.id+'_update" class="my-autocompleter-list shadow"></div>'});
        element.value = this.options.initialText;
    }
});


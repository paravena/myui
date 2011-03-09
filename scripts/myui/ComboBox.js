var MY = {};

/**
 * ComboBox control
 */
MY.ComboBox = Class.create(MY.Autocompleter, {
    initialize : function(element, options) {
        element = $(element);
        var self = this;
        this.element = element;
        this.id = element.id;
        this.hasFocus = false;
        this.changed = false;
        this.active = false;
        this.index = 0;
        this.entryCount = 0;
        this.oldElementValue = this.element.value;
        this.options = options || {};

        if (this.setOptions)
            this.setOptions(this.options);

        this.options.items = this.options.items || [];
        this.options.paramName = this.options.paramName || this.element.name;
        this.options.tokens = this.options.tokens || [];
        this.options.frequency = this.options.frequency || 0.4;
        this.options.minChars = this.options.minChars || 0;
        this.options.listTextPropertyName = this.options.listTextPropertyName || 'text';
        this.options.listValuePropertyName = this.options.listValuePropertyName || 'value';
        this.options.height = this.options.height || null;
        this.options.initialText = this.options.initialText || '';

        this.options.decorate = this.options.decorate ||  function() {
            self.decorate(element);
        };

        this.options.onShow = this.options.onShow ||
                function(element, update) {
                    update.style.position = 'absolute';
                    var d = element.getDimensions();
                    var p = element.offsetParent.positionedOffset();
                    if (Prototype.Browser.WebKit) p.top = element.offsetParent.offsetTop; // TODO remove this code asap
                    var vh = document.viewport.getHeight(); // view port height
                    var vst = document.viewport.getScrollOffsets().top; // view port scrolling top
                    var rh = vh + vst - p.top - d.height; // remaining height
                    var uh = (self.entryCount * 22) + 6;
                    if (rh > (p.top - vst)) {
                        if (uh > rh) uh = rh - 10;
                        update.setStyle({
                            top : (d.height + 3) + 'px',
                            left : '-1px',
                            width : (d.width + 15) + 'px',
                            height: uh + 'px'
                        });
                    } else {
                        var topPos = d.height + 3;
                        if (uh > (p.top - vst)) {
                            uh = p.top - vst - 10;
                            topPos = -(uh + 4);
                        } else if (uh > rh) {
                            topPos = -(uh + 4);
                        }
                        update.setStyle({
                            top : topPos + 'px',
                            left : '-1px',
                            width : (d.width + 15) + 'px',
                            height: uh + 'px'
                        });
                    }
                    update.show();
                };

        this.options.onHide = this.options.onHide ||
                function(element, update) {
                    update.hide();
                    self.hasFocus = false;
                    self.active = false;
                };

        if (typeof(this.options.tokens) == 'string')
            this.options.tokens = new Array(this.options.tokens);

        // Force carriage returns as token delimiters anyway
        if (!this.options.tokens.include('\n'))
            this.options.tokens.push('\n');

        this.observer = null;

        this.element.setAttribute('autocomplete', 'off');
        this.options.decorate();

        this.update = $(this.id + '_update');
        this.container = $(this.id + '_container');
        this.update.hide();

        Event.observe(document, 'click', this.onBlur.bindAsEventListener(this));
        Event.observe(this.element, 'keydown', this.onKeyPress.bindAsEventListener(this));
        Event.observe(this.element, 'click', this.onClickInput.bindAsEventListener(this));
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
    },

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
    },

    setOptions : function(options) {
        this.options = Object.extend({
            choices : 10,
            partialSearch : true,
            partialChars : 1,
            ignoreCase : true,
            fullSearch : false,
            selector : function(instance) {
                var result = []; // Beginning matches
                var partial = []; // Inside matches
                var entry = instance.getToken();
                var items = instance.options.items;
                var listTextPropertyName = instance.options.listTextPropertyName;
                var listValuePropertyName = instance.options.listValuePropertyName;
                var text = '';
                var value = '';
                for (var i = 0; i < items.length && result.length < instance.options.choices; i++) {
                    if (typeof(items[i]) == 'object') {
                        text = items[i][listTextPropertyName];
                        value = items[i][listValuePropertyName];
                    } else {
                        text = items[i];
                        value = items[i];
                    }
                    var foundPos = instance.options.ignoreCase ? text.toLowerCase().indexOf(entry.toLowerCase()) : text.indexOf(entry);

                    while (foundPos != -1) {
                        if (foundPos == 0 && text.length != entry.length) {
                            result.push("<li id=\"" + value + "\"><strong>" + text.substr(0, entry.length) + "</strong>" + text.substr(entry.length) + "</li>");
                            break;
                        } else if (entry.length >= instance.options.partialChars && instance.options.partialSearch && foundPos != -1) {
                            if (instance.options.fullSearch || /\s/.test(text.substr(foundPos - 1, 1))) {
                                partial.push("<li>" + text.substr(0, foundPos) + "<strong>" +
                                        text.substr(foundPos, entry.length) + "</strong>" + text.substr(
                                        foundPos + entry.length) + "</li>");
                                break;
                            }
                        }
                        foundPos = instance.options.ignoreCase ?
                                text.toLowerCase().indexOf(entry.toLowerCase(), foundPos + 1) :
                                text.indexOf(entry, foundPos + 1);
                    }
                }
                if (partial.length)
                    result = result.concat(partial.slice(0, instance.options.choices - result.length));
                return "<ul>" + result.join('') + "</ul>";
            },

            all : function(instance) {
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
            }
        }, options || {});
    }
});


/**
 * Autocompleter control
 */
MY.Autocompleter = Class.create(MY.TextField, {
    initialize : function(options) {
        this.baseInitialize(options);
    },

    baseInitialize : function($super, options) {
        $super(options);
        var self = this;
        this.element = $(options.input);
        this.hasFocus = false;
        this.changed = false;
        this.active = false;
        this.index = 0;
        this.entryCount = 0;

        this.options = $H({
            items : null,
            listId: null,
            tokens : [],
            frequency : 0.4,
            minChars : 2,
            url : null,
            parameters : {},
            finderParamName : 'find',
            listTextPropertyName : 'text',
            listValuePropertyName : 'value',
            height : null,
            initialText : '',
            indicator : null,
            autoSelect : false
        }).merge(options || {}).toObject();

        if (this.setOptions)
            this.setOptions(this.options);

        this.options.decorate = this.options.decorate ||  function() {
            self.decorate(self.element);
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
                    var offsetTop = element.offsetParent.cumulativeOffset().top - element.offsetParent.cumulativeScrollOffset().top;
                    var topPos = d.height + offsetTop + 2;
                    var leftPos = element.offsetParent.cumulativeOffset().left - element.offsetParent.cumulativeScrollOffset().left;
                    if (rh > (p.top - vst)) { // down
                        if (uh > rh) uh = rh - 10;
                        update.setStyle({
                            top : topPos + 'px',
                            left : leftPos + 'px',
                            width : (self.elementWidth - 2) + 'px',
                            height: uh + 'px'
                        });
                    } else { // above
                        if (uh > (p.top - vst)) {
                            uh = p.top - vst - 10;
                            topPos = -(uh + 8);
                        } else if (uh > rh) {
                            topPos = -(uh + 8);
                        }
                        update.setStyle({
                            top : topPos + 'px',
                            left : leftPos + 'px',
                            width : (self.elementWidth - 2) + 'px',
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
        if (this.element) this.render(this.element);
    },

    render : function($super, input) {
        $super(input);
        this.element = $(input);
        this.id = this.element.id;
        this.oldElementValue = this.element.value;
        this.elementWidth = this.element.getDimensions().width;
        this.options.paramName = this.options.paramName || this.element.name;
        this.element.setAttribute('autocomplete', 'off');
        this.options.decorate();
        this.container = $(this.id + '_container');
        $(document).observe('click', this.onBlur.bindAsEventListener(this));
        this.element.observe('keydown', this.onKeyPress.bindAsEventListener(this));
    },

    show: function() {
        this.options.onShow(this.element, this.update);
    },

    getItems : function() {
        return this.options.items;
    },

    getUpdatedChoices : function() {
        if (!this.update) {
            document.body.insert('<div id="'+this.id+'_update" class="my-autocompleter-list shadow"></div>');
            this.update = $(this.id+'_update');
        }
        if (this.options.url) {
            var self = this;
            var parameters = this.options.parameters;
            parameters[this.options.finderParamName] = this.getToken();
            this.startIndicator();
            new Ajax.Request(this.options.url, {
                onComplete: function(response) {
                    self.options.items = response.responseText.evalJSON();
                    self.stopIndicator();
                    self.updateChoices(self.options.selector(self));
                },
                parameters: parameters
            });
        } else {
            this.updateChoices(this.options.selector(this));
        }
    },

    onBlur : function(event) {
        var target = Event.findElement(event);
        var ancestor = this.container;
        var blurFlg = true;
        if (target.descendantOf(ancestor)) blurFlg = false;
        if (blurFlg) {
            this.hide();
            this.hasFocus = false;
            this.active = false;
        }
    },

    decorate : function(element) {
        var width = element.getDimensions().width;
        var height = element.getDimensions().height;
        element.setStyle({width: (width - 8) + 'px'});
        Element.wrap(element, 'div'); // auto complete container
        var container = element.up();
        container.addClassName('my-autocompleter');
        container.id = this.id + '_container';
        container.setStyle({width : width + 'px', height: height + 'px'});
    },

    hide: function() {
        this.stopIndicator();
        //if (Element.getStyle(this.update, 'display') != 'none') this.options.onHide(this.element, this.update);
        if (this.update) {
            this.update.remove();
            this.active = false;
            this.hasFocus = false;
            this.update = null;
         }
    },

    startIndicator: function() {
        if (this.options.indicator) Element.show(this.options.indicator);
    },

    stopIndicator: function() {
        if (this.options.indicator) Element.hide(this.options.indicator);
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
                    this.renderList();
                    event.stop();
                    return;
                case Event.KEY_DOWN:
                    this.markNext();
                    this.renderList();
                    event.stop();
                    return;
            }
        } else if (event.keyCode == Event.KEY_TAB ||
                   event.keyCode == Event.KEY_RETURN ||
                   event.keyCode == Event.KEY_DOWN ||
                   (Prototype.Browser.WebKit > 0 && event.keyCode == 0)) {
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
            }
        }, options || {});
    },

    activate: function() {
        this.changed = false;
        this.hasFocus = true;
        this.getUpdatedChoices();
    },

    onHover: function(event) {
        var element = Event.findElement(event, 'LI');
        if (this.index != element.autocompleteIndex) {
            this.index = element.autocompleteIndex;
            this.renderList();
        }
    },

    onClick: function(event) {
        var element = Event.findElement(event, 'LI');
        this.index = element.autocompleteIndex;
        this.selectEntry();
        this.hide();
    },

    renderList: function() {
        if (this.index == undefined) this.index = 0;
        if (this.entryCount > 0) {
            for (var i = 0; i < this.entryCount; i++)
                if (this.index == i)
                    Element.addClassName(this.getEntry(i), "selected");
                else
                    Element.removeClassName(this.getEntry(i), "selected");
            if (this.hasFocus) {
                this.show();
                this.active = true;
            }
        } else {
            this.active = false;
            this.hide();
        }
    },

    markPrevious: function() {
        if (this.index > 0)
            this.index--;
        else
            this.index = this.entryCount - 1;
        this.getEntry(this.index).scrollIntoView(false);
    },

    markNext: function() {
        if (this.index < this.entryCount - 1)
            this.index++;
        else
            this.index = 0;
        this.getEntry(this.index).scrollIntoView(false);
    },

    getEntry: function(index) {
        return this.update.firstChild.childNodes[index];
    },

    getCurrentEntry: function() {
        return this.getEntry(this.index);
    },

    selectEntry: function() {
        this.updateElement(this.getCurrentEntry());
    },

    updateElement: function(selectedElement) {
        // if an updateElement method is provided
        if (this.options.updateElement) {
            this.options.updateElement(selectedElement);
            return;
        }
        var value = '';
        if (this.options.select) {
            var nodes = $(selectedElement).select('.' + this.options.select) || [];
            if (nodes.length > 0) value = Element.collectTextNodes(nodes[0], this.options.select);
        } else
            value = Element.collectTextNodesIgnoreClass(selectedElement, 'informal');

        var bounds = this.getTokenBounds();

        if (bounds[0] != -1) {
            var newValue = this.element.value.substr(0, bounds[0]);
            var whitespace = this.element.value.substr(bounds[0]).match(/^\s+/);
            if (whitespace)
                newValue += whitespace[0];
            this.element.value = newValue + value + this.element.value.substr(bounds[1]);
        } else {
            this.element.value = value;
        }
        this.oldElementValue = this.element.value;
        this.element.value = Element.collectTextNodesIgnoreClass(selectedElement, 'informal');
        this.oldElementValue = this.element.value;
        this.element.focus();

        if (this.options.afterUpdateElement)
            this.options.afterUpdateElement(this.element, selectedElement);
    },

    updateChoices: function(choices) {
        if (!this.changed && this.hasFocus) {
            this.update.innerHTML = choices;
            Element.cleanWhitespace(this.update);
            Element.cleanWhitespace(this.update.down());
            if (this.update.firstChild && this.update.down().childNodes) {
                this.entryCount = this.update.down().childNodes.length;
                for (var i = 0; i < this.entryCount; i++) {
                    var entry = this.getEntry(i);
                    entry.autocompleteIndex = i;
                    this.addObservers(entry);
                }
            } else {
                this.entryCount = 0;
            }
            this.stopIndicator();
            if (this.index == undefined) this.index = 0;

            if (this.entryCount == 1 && this.options.autoSelect) {
                this.selectEntry();
                this.hide();
            } else {
                this.renderList();
            }
        }
    },

    addObservers: function(element) {
        element.observe('mouseover', this.onHover.bindAsEventListener(this));
        element.observe('click', this.onClick.bindAsEventListener(this));
    },

    onObserverEvent: function() {
        this.changed = false;
        this.tokenBounds = null;
        if (this.getToken().length >= this.options.minChars) {
            this.getUpdatedChoices();
        } else {
            this.active = false;
            this.hide();
        }
        this.oldElementValue = this.element.value;
    },

    getToken: function() {
        var bounds = this.getTokenBounds();
        return this.element.value.substring(bounds[0], bounds[1]).strip();
    },

    getTokenBounds: function() {
        if (this.tokenBounds != null) return this.tokenBounds;
        var value = this.element.value;
        if (value.strip().empty()) return [-1, 0];
        var diff = this.getFirstDifferencePos(value, this.oldElementValue);
        var offset = (diff == this.oldElementValue.length ? 1 : 0);
        var prevTokenPos = -1, nextTokenPos = value.length;
        var tp;
        for (var index = 0, l = this.options.tokens.length; index < l; ++index) {
            tp = value.lastIndexOf(this.options.tokens[index], diff + offset - 1);
            if (tp > prevTokenPos) prevTokenPos = tp;
            tp = value.indexOf(this.options.tokens[index], diff + offset);
            if (-1 != tp && tp < nextTokenPos) nextTokenPos = tp;
        }
        return (this.tokenBounds = [prevTokenPos + 1, nextTokenPos]);
    },

    getFirstDifferencePos : function(newS, oldS) {
        var boundary = Math.min(newS.length, oldS.length);
        for (var index = 0; index < boundary; ++index)
            if (newS[index] != oldS[index])
                return index;
        return boundary;
    }
});
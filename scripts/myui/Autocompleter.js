/**
 * MYUI, version 1.0
 *
 * Dual licensed under the MIT and GPL licenses.
 *
 * Copyright 2009 Pablo Aravena, all rights reserved.
 * http://pabloaravena.info
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
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
            autoSelect : false,
            choices : 10,
            partialSearch : true,
            partialChars : 1,
            ignoreCase : true,
            fullSearch : false,
            getParameters : null
        }).merge(options || {}).toObject();

        this.options.decorate = this.options.decorate ||  function() {
            self.decorate(self.element);
        };

        this.options.onShow = this.options.onShow ||
                function(element, update) {
                    update.style.position = 'absolute';
                    var d = element.getDimensions();
                    var p = element.cumulativeOffset();
                    var vh = document.viewport.getHeight(); // view port height
                    var vst = document.viewport.getScrollOffsets().top; // view port scrolling top
                    var rh = vh + vst - p.top - d.height; // remaining height
                    var uh = (self.entryCount * 22) + 6;
                    var offsetTop = element.cumulativeOffset().top;
                    var offsetLeft = element.cumulativeOffset().left;
                    var scrollTop = 0;
                    if (self.tableGrid)
                        scrollTop = self.tableGrid.bodyDiv.scrollTop;
                    var topPos = d.height + offsetTop - scrollTop + 2;
                    var scrollLeft = 0;
                    if (self.tableGrid)
                        scrollLeft = self.tableGrid.bodyDiv.scrollLeft;
                    var leftPos = offsetLeft - scrollLeft;
                    if (rh >= (p.top - vst)) { // down
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
                            topPos = p.top - (uh + scrollTop + 4);
                        } else if (uh > rh) {
                            topPos = p.top - (uh + scrollTop + 4);
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

        this.options.selector = this.options.selector ||
                function() {
                    var result = []; // Beginning matches
                    var partial = []; // Inside matches
                    var entry = self.getToken();
                    var items = self.options.items;
                    var listTextPropertyName = self.options.listTextPropertyName;
                    var listValuePropertyName = self.options.listValuePropertyName;
                    var text = '';
                    var value = '';
                    for (var i = 0; i < items.length && result.length < self.options.choices; i++) {
                        if (typeof(items[i]) == 'object') {
                            text = items[i][listTextPropertyName];
                            value = items[i][listValuePropertyName];
                        } else {
                            text = items[i];
                            value = items[i];
                        }
                        var foundPos = self.options.ignoreCase ? text.toLowerCase().indexOf(entry.toLowerCase()) : text.indexOf(entry);

                        while (foundPos != -1) {
                            if (foundPos == 0 && text.length != entry.length) {
                                result.push("<li id=\"" + value + "\"><strong>" + text.substr(0, entry.length) + "</strong>" + text.substr(entry.length) + "</li>");
                                break;
                            } else if (entry.length >= self.options.partialChars && self.options.partialSearch && foundPos != -1) {
                                if (self.options.fullSearch || /\s/.test(text.substr(foundPos - 1, 1))) {
                                    partial.push("<li>" + text.substr(0, foundPos) + "<strong>" +
                                            text.substr(foundPos, entry.length) + "</strong>" + text.substr(
                                            foundPos + entry.length) + "</li>");
                                    break;
                                }
                            }
                            foundPos = self.options.ignoreCase ?
                                    text.toLowerCase().indexOf(entry.toLowerCase(), foundPos + 1) :
                                    text.indexOf(entry, foundPos + 1);
                        }
                    }
                    if (partial.length)
                        result = result.concat(partial.slice(0, self.options.choices - result.length));
                    return "<ul>" + result.join('') + "</ul>";
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
        this.element.observe('keydown', this._onKeyPress.bindAsEventListener(this));
    },

    show : function() {
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
            if (this.options.getParameters) {
                var moreParams = this.options.getParameters();
                for (var p in moreParams)
                    parameters[p] = moreParams[p];
            }
            this.startIndicator();
            new Ajax.Request(this.options.url, {
                onComplete: function(response) {
                    self.options.items = response.responseText.evalJSON();
                    self.stopIndicator();
                    self.updateChoices(self.options.selector());
                },
                parameters: parameters
            });
        } else {
            this.updateChoices(this.options.selector());
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

    hide : function() {
        this.stopIndicator();
        //if (Element.getStyle(this.update, 'display') != 'none') this.options.onHide(this.element, this.update);
        if (this.update) {
            this.update.remove();
            this.active = false;
            this.hasFocus = false;
            this.update = null;
        }
    },

    startIndicator : function() {
        if (this.options.indicator) Element.show(this.options.indicator);
    },

    stopIndicator : function() {
        if (this.options.indicator) Element.hide(this.options.indicator);
    },

    _onKeyPress: function(event) {
        if (this.active) {
            switch (event.keyCode) {
                case Event.KEY_TAB:
                case Event.KEY_RETURN:
                    this.selectEntry();
                    Event.stop(event);
                case Event.KEY_ESC:
                    this.hide();
                    this.active = false;
                    event.stop();
                    return false;
                case Event.KEY_LEFT:
                case Event.KEY_RIGHT:
                    return false;
                case Event.KEY_UP:
                    this.markPrevious();
                    this._renderList();
                    event.stop();
                    return false;
                case Event.KEY_DOWN:
                    this.markNext();
                    this._renderList();
                    event.stop();
                    return false;
            }
        } else if (event.keyCode == Event.KEY_TAB ||
                   event.keyCode == Event.KEY_RETURN ||
                   event.keyCode == Event.KEY_DOWN ||
                   (Prototype.Browser.WebKit > 0 && event.keyCode == 0)) {
            return false;
        }

        this.changed = true;
        this.hasFocus = true;
        if (this.observer) clearTimeout(this.observer);
        this.observer = setTimeout(this.onObserverEvent.bind(this), this.options.frequency * 1000);
        return false;
    },

    activate : function() {
        this.changed = false;
        this.hasFocus = true;
        this.getUpdatedChoices();
    },

    onHover : function(event) {
        var element = Event.findElement(event, 'LI');
        if (this.index != element.autocompleteIndex) {
            this.index = element.autocompleteIndex;
            this._renderList();
        }
    },

    onClick : function(event) {
        var element = Event.findElement(event, 'LI');
        this.index = element.autocompleteIndex;
        this.selectEntry();
        this.hide();
    },

    _renderList : function() {
        if (this.index == undefined) this.index = 0;
        if (this.entryCount > 0) {
            for (var i = 0; i < this.entryCount; i++)
                if (this.index == i)
                    Element.addClassName(this._getEntry(i), "selected");
                else
                    Element.removeClassName(this._getEntry(i), "selected");
            if (this.hasFocus) {
                this.show();
                this.active = true;
            }
        } else {
            this.active = false;
            this.hide();
        }
    },

    markPrevious : function() {
        if (this.index > 0)
            this.index--;
        else
            this.index = this.entryCount - 1;
        this._syncScroll(this._getEntry(this.index), false);
    },

    markNext : function() {
        if (this.index < this.entryCount - 1)
            this.index++;
        else
            this.index = 0;
        this._syncScroll(this._getEntry(this.index), true);
    },

    resetItems : function() {
        this.options.items = null;
    },

    _getEntry : function(index) {
        return this.update.firstChild.childNodes[index];
    },

    _syncScroll : function(entry, bottomFlg) {
        var updateHeight = this.update.getDimensions().height;
        var scrollTop = this.update.scrollTop;
        if (entry.offsetTop > scrollTop && entry.offsetTop < (scrollTop + updateHeight - 10))
            return;
        if (!bottomFlg) {
            this.update.scrollTop = entry.offsetTop;
        } else {
            this.update.scrollTop = entry.offsetTop - (updateHeight - entry.getDimensions().height - 5);
        }
    },

    getCurrentEntry : function() {
        return this._getEntry(this.index);
    },

    selectEntry : function() {
        this.updateElement(this.getCurrentEntry());
    },

    getValue : function() {
        return this.oldElementValue;
    },

    updateElement : function(selectedElement) {
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
        this.validate();
        this.element.focus();
        if (this.options.afterUpdate)
            this.options.afterUpdate(this.element, selectedElement);
    },

    updateChoices : function(choices) {
        if (!this.changed && this.hasFocus) {
            this.update.innerHTML = choices;
            Element.cleanWhitespace(this.update);
            Element.cleanWhitespace(this.update.down());
            if (this.update.firstChild && this.update.down().childNodes) {
                this.entryCount = this.update.down().childNodes.length;
                for (var i = 0; i < this.entryCount; i++) {
                    var entry = this._getEntry(i);
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
                this._renderList();
            }
        }
    },

    addObservers : function(element) {
        $(element).observe('mouseover', this.onHover.bindAsEventListener(this));
        $(element).observe('click', this.onClick.bindAsEventListener(this));
    },

    onObserverEvent : function() {
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

    getToken : function() {
        var bounds = this.getTokenBounds();
        return this.element.value.substring(bounds[0], bounds[1]).strip();
    },

    getTokenBounds : function() {
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
    },

    getSelectedValue : function(text) {
        var items = this.options.items;
        var listTextPropertyName = this.options.listTextPropertyName;
        var listValuePropertyName = this.options.listValuePropertyName;
        var result = text;
        if (items) {
            for (var i = 0; i < items.length; i++) {
                // This check prevents the case when items is just an array of strings
                if (items[i] instanceof Object) {
                    if (items[i][listTextPropertyName] === text) {
                        result = items[i][listValuePropertyName];
                        break;
                    }
                } else {
                    break;
                }
            }
        }
        return result;
    }
});
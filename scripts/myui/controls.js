/**
 * MyTableGrid, version 1.1.0
 *
 * Dual licensed under the MIT and GPL licenses.
 *
 * Copyright 2009 Pablo Aravena, all rights reserved.
 * http://pabloaravena.info/myui
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
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
MyTableGrid.CellCheckbox = Class.create({
	initialize : function(options) {
		options = options || {};
		this.onClickCallback = options.onClick || null;
        this.selectable = options.selectable || false;
        if(options.getValueOf) this.getValueOf = options.getValueOf;
	}
});


MyTableGrid.CellRadioButton = Class.create({
	initialize : function(options) {
		options = options || {};
		this.onClickCallback = options.onClick || null;
        this.selectable = options.selectable || false;
        if(options.getValueOf) this.getValueOf = options.getValueOf;
	}
});

MyTableGrid.CellInput = Class.create({
	initialize : function(options) {
		options = options || {};
		this.afterUpdateCallback = options.afterUpdate || null;
        this.onKeyPressCallback = options.onKeyPress || null;
        this.validate = options.validate || null;
	},

    render : function(tableGrid, options) {
        tableGrid = tableGrid || null;
        options = options || {};
        var inputId = 'mtgInput';
        var currentElement = null;

        if (tableGrid != null) {
            var coords = tableGrid.getCurrentPosition();
            inputId = 'mtgInput' + tableGrid._mtgId + '_' + coords[0] + ',' + coords[1];
            currentElement = tableGrid.getCellElementAt(coords[0], coords[1]);
        }

        var div = new Element('div').setStyle({border: 0, margin: 0, padding: 0});
        var marginTop = '2px';
        if (Prototype.Browser.IE) {
            var ieVersion = parseInt(navigator.userAgent.substring(navigator.userAgent.indexOf("MSIE")+5));
            if (ieVersion <= 7) marginTop = '1px';
        }
        var  input = new Element('input', {id: inputId,
            type: 'text',
            value: options.value
        });
        input.addClassName('mtgInputText');
        input.setStyle({
            width: (options.width - 10) + 'px',
            height: (options.height - 8) + 'px',
            textAlign: options.align,
            marginTop: marginTop
        });
        div.insert(input);

        if (this.onKeyPressCallback) {
            var self = this;
            input.observe('keydown', function(event) {
                self.onKeyPressCallback(event, input.value, currentElement);
            });
        }
        return div;
    }
});

MyTableGrid.BrowseInput = Class.create({
	initialize : function(options) {
		options = options || {};
		this.afterUpdate = options.afterUpdate || null;
		this.onClick = options.onClick || null;
        this.validate = options.validate || null;
	},

	render : function(tableGrid, options) {
		tableGrid = tableGrid || null;
		options = options || {};
		var inputId = 'mtgInput';
		var self = this;

		if (tableGrid != null) {
			var coords = tableGrid.getCurrentPosition();
			inputId = 'mtgInput' + tableGrid._mtgId + '_' + coords[0] + ',' + coords[1];
		}

		var div = new Element('div').setStyle({border: 0, margin: 0, padding: 0});

		var input = new Element('input', {id: inputId,
			type: 'text',
			value: options.value
		});

		input.addClassName('mtgInputText');
        var marginTop = '2px';
        if (Prototype.Browser.IE) {
            var ieVersion = parseInt(navigator.userAgent.substring(navigator.userAgent.indexOf("MSIE")+5));
            if (ieVersion <= 7) marginTop = '1px';
        }

		input.setStyle({
			width: (options.width - 10) + 'px',
            marginTop: marginTop
		});
		div.insert(input);
		var brBtn = new Element('div');
		brBtn.addClassName('mtgBrowseBtn');
		var onClickFlg = false;
		Event.observe(brBtn, 'click', function(event) {
            if (window.event) window.event.cancelBubble = true; //IE hack
            event.preventDefault();
            event.stopPropagation();
            event.stopped = true;
            if (self.onClick) self.onClick();
            onClickFlg = true;
		});
		div.insert(brBtn);
		this.afterUpdateCallback = function(element, value) {
			tableGrid.setValueAt(value, coords[0], coords[1]);
			if (self.afterUpdate && !onClickFlg) {
				self.afterUpdate(element, value);
			}
			onClickFlg = false;
		};
		return div;
	}
});

MyTableGrid.ComboBox = Class.create({
	initialize : function(options) {
		options = options || {};
		this.url = options.url || null;
		this.divListId = options.divListId || 'list';
		this.list = options.list || [];
		this.afterUpdateCallback = options.afterUpdate || null;
		this.getParameters = options.getParameters || null;
		this.listTextPropertyName = options.listTextPropertyName || 'text';
		this.listValuePropertyName = options.listValuePropertyName || 'value';
        this.validate = options.validate || this.validateDefault;
		this.autocompleter = null;
		this._tableGrid = null;
		this.showAllFlg = false;
	},

	render : function(tableGrid, options) {
		tableGrid = tableGrid || null;
		options = options || this.options;
		var inputId = 'mtgInput';
		var self = this;

		if (tableGrid != null) {
			var coords = tableGrid.getCurrentPosition();
			inputId = 'mtgInput' + tableGrid._mtgId + '_' + coords[0] + ',' + coords[1];
		}
		var div = new Element('div').setStyle({border: 0, margin: 0, padding: 0});
		var input = new Element('input', {id: inputId,
			type: 'text',
			value: options.value
		});

		input.addClassName('mtgInputText');

        var marginTop = '2px';
        if (Prototype.Browser.IE) {
            var ieVersion = parseInt(navigator.userAgent.substring(navigator.userAgent.indexOf("MSIE")+5));
            if (ieVersion <= 7) marginTop = '1px';
        }

		input.setStyle({
			width: (options.width - 10) + 'px',
            marginTop: marginTop
		});

		div.insert(input);
		var cbBtn = new Element('div');
        cbBtn.addClassName('mtgComboBoxBtn');

		Event.observe(cbBtn, 'click', function(event) {
			self.showAll();
			if (window.event) window.event.cancelBubble = true; //IE hack
			event.preventDefault(); // hack please save my life
			event.stopPropagation(); // hack please save my life
			event.stopped = true;  // hack please save my life
		});

		Event.observe(cbBtn, 'mousemove', function(){
			self.showAllFlg = true;
		});
		Event.observe(cbBtn, 'mouseout', function(){
			self.showAllFlg = false;
		});
		div.insert(cbBtn);
		var divList = this.divListId;

		var opt = {};
		opt.afterUpdateElement = function(element, value) {
			// validate value assigned
			if (self.afterUpdateCallback) self.afterUpdateCallback(element, value);
		};

		opt.listTextPropertyName = this.listTextPropertyName;
		opt.listValuePropertyName = this.listValuePropertyName;

		if (this.url) {
			var request = {};
			if (this.getParameters) {
				request = this.getParameters();
			}
			new Ajax.Request(this.url, {
				onSuccess : function(transport) {
					self.list = transport.responseText.evalJSON();
					self.autocompleter = new Autocompleter.InputElement(input, divList, self.list, opt, self);
				},
                parameters : request
			});
		} else {
			this.autocompleter = new Autocompleter.InputElement(input, divList, this.list, opt, this);
		}
		return div;
	},

	showAll : function() {
		this.autocompleter.hasFocus = true;
		this.autocompleter.getAllChoices();
	},

	hide : function() {
		this.autocompleter.hide();
	},

    validateDefault : function(value, input) {
        var validFlg = false;
        for (var i = 0; i < this.list.length; i++) {
            if (this.list[i][this.listTextPropertyName] == value) {
                validFlg = true;
                break;
            }
        }
        return validFlg;
    },

	getList : function() {
		return this.list;
	},

    getSelectedValue : function(text) { // Truchada
        var list = this.list;
        var value = null;
        for (var i = 0; i < list.length; i++) {
            if (list[i][this.listTextPropertyName] == text) {
                value = list[i][this.listValuePropertyName];
                break;
            }
        }
        return value;
    }
});

Autocompleter.InputElement = Class.create(Autocompleter.Base, {
	initialize : function(element, update, array, options, cbRef) {
		this.baseInitialize(element, update, options);
		this.options.array = array;
		this.options.minChars = 0;
		this.listTextPropertyName = options.listTextPropertyName || 'text';
		this.listValuePropertyName = options.listValuePropertyName || 'value';
		this.cbRef = cbRef || null;
	},

	getUpdatedChoices : function() {
		this.updateChoices(this.options.selector(this));
	},

	getAllChoices : function() {
		this.updateChoices(this.options.all(this));
	},

	onBlur : function(event) {
		if (!this.cbRef.showAllFlg) {
			setTimeout(this.hide.bind(this), 250);
			this.hasFocus = false;
			this.active = false;
		}
	},

	onKeyPress: function(event) {
		if(this.active)
			switch(event.keyCode) {
				case Event.KEY_TAB:
				case Event.KEY_RETURN:
					this.selectEntry();
					Event.stop(event);
				case Event.KEY_ESC:
					this.hide();
					this.active = false;
					Event.stop(event);
					return;
				case Event.KEY_LEFT:
				case Event.KEY_RIGHT:
					return;
				case Event.KEY_UP:
					this.markPrevious();
					this.render();
					Event.stop(event);
					return;
				case Event.KEY_DOWN:
					this.markNext();
					this.render();
					Event.stop(event);
					return;
			}
		else
			if(event.keyCode==Event.KEY_TAB || event.keyCode==Event.KEY_RETURN || (Prototype.Browser.WebKit > 0 && event.keyCode == 0)) return;
		this.keyPressed = event.keyCode; // This hack allows when the key down is pressed all options are shown
		this.changed = true;
		this.hasFocus = true;

		if(this.observer) clearTimeout(this.observer);
		this.observer =	setTimeout(this.onObserverEvent.bind(this), this.options.frequency*1000);
	},

	setOptions : function(options) {
		this.options = Object.extend({
			choices : 10,
			partialSearch : true,
			partialChars : 1,
			ignoreCase : true,
			fullSearch : false,
			selector : function(instance) {
				var ret = []; // Beginning matches
				var partial = []; // Inside matches
				var entry = instance.getToken();
				var elem = '';
				var value = '';
				var i = 0;
				if (instance.keyPressed == Event.KEY_DOWN && !instance.active) {
					for (i = 0; i < instance.options.array.length; i++) {
						elem = instance.options.array[i][instance.listTextPropertyName];
						value = instance.options.array[i][instance.listValuePropertyName];
						ret.push('<li id=\"' + value + '\">'+elem+'</li>');
					}
				} else {
					for (i = 0; i < instance.options.array.length &&
									ret.length < instance.options.choices; i++) {
						elem = instance.options.array[i][instance.listTextPropertyName];
						value = instance.options.array[i][instance.listValuePropertyName];

						var foundPos = instance.options.ignoreCase ?
									   elem.toLowerCase().indexOf(entry.toLowerCase()) :
									   elem.indexOf(entry);

						while (foundPos != -1) {
							if (foundPos == 0 && elem.length != entry.length) {
								ret.push("<li id=\"" + value + "\"><strong>" + elem.substr(0, entry.length) + "</strong>" +
										 elem.substr(entry.length) + "</li>");
								break;
							} else if (entry.length >= instance.options.partialChars &&
									   instance.options.partialSearch && foundPos != -1) {
								if (instance.options.fullSearch || /\s/.test(elem.substr(foundPos - 1, 1))) {
									partial.push("<li>" + elem.substr(0, foundPos) + "<strong>" +
												 elem.substr(foundPos, entry.length) + "</strong>" + elem.substr(
											foundPos + entry.length) + "</li>");
									break;
								}
							}

							foundPos = instance.options.ignoreCase ?
									   elem.toLowerCase().indexOf(entry.toLowerCase(), foundPos + 1) :
									   elem.indexOf(entry, foundPos + 1);

						}
					}
				}

				if (partial.length)
					ret = ret.concat(partial.slice(0, instance.options.choices - ret.length));
				return "<ul>" + ret.join('') + "</ul>";
			},
			all : function(instance) {
				var ret = [];
				var elem = '';
				var value = '';
				for (var i = 0; i < instance.options.array.length; i++) {
					elem = instance.options.array[i][instance.listTextPropertyName];
					value = instance.options.array[i][instance.listValuePropertyName];
					ret.push('<li id="' + value + '">' + elem + '</li>');
				}
				return '<ul>' + ret.join('') + '</ul>';
			},

			onShow : function(element, update) {
                if(!update.style.position || update.style.position=='absolute') {
					update.style.position = 'absolute';
					Position.clone(element, update, {
						setHeight: false,
						offsetTop: element.offsetHeight + 3
					});
				}
				Effect.BlindDown(update, {duration: 0.15});
			}
		}, options || { });
	}
});


MyTableGrid.CellCalendar = Class.create({
	initialize : function(options) {
		options = options || {};
		this.afterUpdateCallback = options.afterUpdate || null;
		this.getParameters = options.getParameters || null;
        this.validate = options.validate || null;
		this._tableGrid = null;
	},

	render : function(tableGrid, options) {
		tableGrid = tableGrid || null;
		options = options || this.options;
		var inputId = 'mtgInput';

		if (tableGrid != null) {
			var coords = tableGrid.getCurrentPosition();
			inputId = 'mtgInput' + tableGrid._mtgId + '_' + coords[0] + ',' + coords[1];
		}

		var div = new Element('div').setStyle({border: 0, margin: 0, padding: 0});
		var input = new Element('input', {id: inputId,
			type: 'text',
			value: options.value
		});

		input.addClassName('mtgInputText');
        var marginTop = '2px';
        if (Prototype.Browser.IE) {
            var ieVersion = parseInt(navigator.userAgent.substring(navigator.userAgent.indexOf("MSIE")+5));
            if (ieVersion <= 7) marginTop = '1px';
        }

		input.setStyle({
			width: (options.width - 10) + 'px',
            marginTop: marginTop
		});
		div.insert(input);
		var calBtn = new Element('div');
		calBtn.addClassName('mtgCalendarBtn');
		Event.observe(calBtn, 'click', function(event) {
			new MyTableGrid.Calendar(input, tableGrid);
			if (window.event) window.event.cancelBubble = true; //IE hack
			event.preventDefault();
			event.stopPropagation();
			event.stopped = true;
		});
		div.insert(calBtn);
		return div;
	}
});

MyTableGrid.Calendar = Class.create(CalendarDateSelect, {
	initialize: function($super, input, tableGrid) {
		this._tableGrid = tableGrid || null;
		$super(input);
	},

	positionCalendarDiv : function() {
		var above = false;
		var c_dim = this.calendar_div.getDimensions();
		var c_height = c_dim.height;
		var c_width = c_dim.width;
		var w_top = this._tableGrid.scrollTop;
		var w_height = this._tableGrid.tableHeight;
		var e_dim = $(this.options.get("popup_by")).cumulativeOffset();
		var e_top = e_dim[1];
		var e_left = e_dim[0];
		var e_height = $(this.options.get("popup_by")).getDimensions().height;
		var e_bottom = e_top + e_height;
		var offsetTop = this._tableGrid.scrollTop;
		var offsetLeft = this._tableGrid.scrollLeft;

		if ((( e_bottom + c_height ) > (w_top + w_height)) && ( e_bottom - c_height > w_top )) above = true;
		above = false;
		var left_px = (e_left - offsetLeft).toString() + "px";
		var top_px = (above ? (e_top - c_height - offsetTop) : ( e_top + e_height - offsetTop)).toString() + "px";

		this.calendar_div.style.left = left_px;
		this.calendar_div.style.top = top_px;

		this.calendar_div.setStyle({visibility:""});

		// draw an iframe behind the calendar -- ugly hack to make IE 6 happy
		if (navigator.appName == "Microsoft Internet Explorer") this.iframe = $(document.body).build("iframe", {src: "javascript:false", className: "ie6_blocker"}, { left: left_px, top: top_px, height: c_height.toString() + "px", width: c_width.toString() + "px", border: "0px"});
	}
});
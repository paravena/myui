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

MY.TableGrid.CellCheckbox = Class.create({
	initialize : function(options) {
		options = options || {};
		this.onClickCallback = options.onClick || null;
        this.selectable = options.selectable || false;
        if(options.getValueOf) this.getValueOf = options.getValueOf;
	}
});


MY.TableGrid.CellRadioButton = Class.create({
	initialize : function(options) {
		options = options || {};
		this.onClickCallback = options.onClick || null;
        this.selectable = options.selectable || false;
        if(options.getValueOf) this.getValueOf = options.getValueOf;
	}
});

MY.TableGrid.CellInput = Class.create({
	initialize : function(options) {
		options = options || {};
		this.afterUpdateCallback = options.afterUpdate || null;
        this.onKeyPressCallback = options.onKeyPress || null;
        this.validate = options.validate || null;
	},

    render : function(input) {
    }
});

MY.TableGrid.BrowseInput = Class.create({
	initialize : function(options) {
		options = options || {};
		this.afterUpdate = options.afterUpdate || null;
		this.onClick = options.onClick || null;
        this.validate = options.validate || null;
	},

	render : function(tableGrid, options) {
        /* TODO review
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
		*/
	}
});

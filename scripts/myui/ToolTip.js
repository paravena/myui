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
MY.ToolTip = Class.create({
    initialize: function(options) {
        options = options || {};
        this.message = options.message || null;
        this.parentElement = $(options.parent);
        this.type = options.type || 'info';
        this.render();
        this.onMouseMoveHandler = function(event) {
            var x = Event.pointerX(event) + 10;
            var y = Event.pointerY(event) + 10;
            this.show(x, y);
        }.bindAsEventListener(this);
        this.parentElement.observe('mousemove', this.onMouseMoveHandler);

        this.onMouseOutHandler = function(event) {
            this.hide();
        }.bindAsEventListener(this);
        this.parentElement.observe('mouseout', this.onMouseOutHandler);
    },

    render : function() {
        var toolTipId = this.parentElement.id + '_tooltip';
        var html = [];
        html.push('<div id="'+toolTipId+'" class="my-tooltip my-tooltip-' + this.type + ' shadow" style="display:none">');
        html.push('<div class="my-tooltip-inner">');
        html.push(this.message);
        html.push('</div>');
        html.push('</div>');
        document.body.insert(html.join(''));
        this.tooltip = $(toolTipId);

    },

    show : function(x, y) {
        this.tooltip.setStyle({
            position: 'absolute',
            top : y +'px',
            left: x + 'px'
        });
        this.tooltip.show();
    },

    hide: function() {
        this.tooltip.hide();
    },

    remove : function() {
        Event.stopObserving(this.parentElement, 'mousemove', this.onMouseMoveHandler);
        Event.stopObserving(this.parentElement, 'mouseout', this.onMouseOutHandler);
        try {
            this.tooltip.remove();
        } catch(e) {
            // ignored
        }
    }
});
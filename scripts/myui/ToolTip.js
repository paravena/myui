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
        this.tooltip.remove();
    }
});
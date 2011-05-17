MY.ToolTip = Class.create({
    initialize: function(options) {
        options = options || {};
        this.message = options.message || null;
        this.parentElement = $(options.parent);
        this.type = options.type || 'info';
        this.render();
        var self = this;
        this.parentElement.on('mousemove', function(event) {
            var x = Event.pointerX(event);
            var y = Event.pointerY(event);
            self.show(x, y);
        });
        this.parentElement.on('mouseout', function(event) {
            self.hide();
        });
    },

    render : function() {
        var toolTipId = this.parentElement.id + '_tooltip';
        var html = [];
        html.push('<div id="'+toolTipId+'" class="my-tooltip ' + this.type + '" style="display:none">');
        html.push('<span class="my-tooltip-inner">');
        html.push(this.message);
        html.push('</span>');
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
    }
});
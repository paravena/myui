MY.TextField = Class.create({
    initialize : function(options) {
        options = options || {};
        this.input = $(options.input);
        this.id = this.input.id;
        this.name = options.name || this.input;
        this.tabIndex = options.tabIndex || null;
        this.initialText = options.initialText || null;
        this.required = options.required || false;
        this.customValidate = options.validate || null;
        if (this.input) this.render(this.input);
        this.tooltip = null;
    },

    render : function(input) {
        var self = this;
        this.decorate(input);
        input.observe('focus', function(){
            if (self.initialText != null && self.initialText.strip() == input.value)
                input.value = '';
        });
        // registering validate handler
        input.observe('blur', this.validate.bindAsEventListener(this));
    },

    decorate : function(element) {
        if (this.tabIndex) element.setAttribute('tabIndex', this.tabIndex);
        if (this.initialText) element.value = this.initialText;
        var width = element.getDimensions().width;
        var height = element.getDimensions().height;
        Element.wrap(element, 'div');
        this.container = element.up();
        this.container.addClassName('my-textfield-container');
        this.container.id = this.id + '_container';
        this.container.setStyle({width : width + 'px', height: height + 'px'});
    },

    validate : function() {
        var input = this.input;
        if (this.required) {
            if (input.value.strip() == '') {
                input.addClassName('my-textfield-input-error');
                this.tooltip = new MY.ToolTip({
                    parent: input.up(),
                    message : i18n.getMessage('error.required.field', {field : input.name}),
                    type: 'error'
                });
                return;
            } else {
                input.removeClassName('my-textfield-input-error');
                if (this.tooltip) this.tooltip.remove();
            }
        }

        if (this.customValidate) {
            var errors = [];
            if (!this.customValidate(input.value, errors)) {
                input.addClassName('my-textfield-input-error');
                if (errors.length > 0) {
                    this.tooltip = new MY.ToolTip({
                        parent: input.up(),
                        message : errors.pop(),
                        type: 'error'
                    });
                }
            } else {
                input.removeClassName('my-textfield-input-error');
                if (this.tooltip) this.tooltip.remove();
            }
        }
    }
});
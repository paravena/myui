MY.TextField = Class.create({
    initialize : function(options) {
        options = options || {};
        this.input = $(options.input);
        this.id = this.input.id;
        this.name = options.name || this.input;
        this.tabIndex = options.tabIndex || null;
        this.initialText = options.initialText || null;
        this.required = options.required || false;
        if (this.input) this.render(this.input);
    },

    render : function(input) {
        var self = this;
        this.decorate(input);
        input.on('focus', function(){
            if (self.initialText != null && self.initialText.strip() == input.value)
                input.value = '';
        });
        // registering validate handler
        input.on('blur', this.validate.bindAsEventListener(this));
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
        /*
        var id = this.id;
        var input = this.input;
        var divHint = this.divHint;
        var errorMessages = MY.TextField.Messages.errors;
        if (this.required) {
            if (input.value.strip() == '') {
                input.addClassName('myuiErrorInput');
                divHint.addClassName('myuiErrorIcon');
                var message = errorMessages.required.replace(/\{0\}/g, this.name);
                new Tip(divHint, message, {
                    title: errorMessages.title,
                    style: 'error',
                    stem: 'topLeft',
                    hook: { tip: 'topLeft', mouse: true },
                    offset: { x: 10, y: 10 }
                });
                return;
            } else {
                input.removeClassName('myuiErrorInput');
                divHint.removeClassName('myuiErrorIcon');
            }
        }

        if (this.customValidate) {
            if (!this.customValidate(input.value)) {
                input.addClassName('myuiErrorInput');
                divHint.addClassName('myuiErrorIcon');
                new Tip(divHint, this.customValidateErrorMsg, {
                    title: errorMessages.title,
                    style: 'error',
                    stem: 'topLeft',
                    hook: { tip: 'topLeft', mouse: true },
                    offset: { x: 10, y: 10 }
                });
            } else {
                input.removeClassName('myuiErrorInput');
                divHint.removeClassName('myuiErrorIcon');
            }
        }
        */
    }
});

MY.TextField.Messages = {
    errors : {
        title: 'An Error Ocurred',
        required: '{0} is required',
        minlength: '{0} cannot be less than {1} characters',
        maxlength: '{0} cannot be more than {1} characters'
    }
};

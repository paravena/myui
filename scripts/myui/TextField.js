var MYUI = new Object();

MYUI.Messages = {
    errors : {
        title: 'An Error Ocurred',
        required: '{0} is required',
        minlength: '{0} cannot be less than {1} characters',
        maxlength: '{0} cannot be more than {1} characters'
    }
};

MY.TextField = Class.create({
    initialize : function(id, options) {
        this.id = id;
        this.input = $(id);
        this.name = options.name || id;
        this.options = options || {};
        this.tabIndex = options.tabIndex || null;
        this.defaultValue = options.defaultValue || null;
        this.required = options.required || false;
        this.width = options.width || 100;
        this.customValidate = options.validate || null;
        this.customValidateErrorMsg = options.validateErrorMsg || '';
    },

    render : function() {
        var id = this.id;
        var input = this.input;
        if (this.tabIndex) input.setAttribute('tabIndex', this.tabIndex);
        var self = this;
        var width = this.width;
        input.addClassName('myuiTextField');
        input.setStyle({
            width: width + 'px'
        });
        if (this.defaultValue) input.value = this.defaultValue;
        // Adding input container
        var inputContainer = new Element('div', {id: 'inputContainer'+id});
        inputContainer.addClassName('myuiInputContainer');
        inputContainer.setStyle({width: (width + 30) + 'px'});
        if (Prototype.Browser.IE) inputContainer.setStyle({zoom:1, display:'inline'});
        input.insert({before: inputContainer});
        input.remove();
        inputContainer.insert(input);
        // Adding input hint
        this.divHint = new Element('div', {
            id: id+'Hint'
        }).update('&#160;');
        this.divHint.addClassName('myuiInputHint');
        if (Prototype.Browser.IE) this.divHint.setStyle({marginTop: '4px'});
        inputContainer.insert(this.divHint);
        Event.observe(input, 'focus', function(){
            if (self.defaultValue != null
                    && self.defaultValue.strip() == input.value)
                input.value = '';
        });
        // registering validate handler
        Event.observe(input, 'blur', this.validate.bind(this));
    },

    validate : function() {
        var id = this.id;
        var input = this.input;
        var divHint = this.divHint;
        var errorMessages = MYUI.Messages.errors;
        if (this.required) {
            if (input.value.strip() == '') {
                input.addClassName('myuiErrorInput');
                divHint.addClassName('myuiErrorIcon');
                var message = errorMessages.required.replace(/\{0\}/g, this.name);
                /*
                new Tip(divHint, message, {
                    title: errorMessages.title,
                    style: 'error',
                    stem: 'topLeft',
                    hook: { tip: 'topLeft', mouse: true },
                    offset: { x: 10, y: 10 }
                });
                */
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
                /*
                new Tip(divHint, this.customValidateErrorMsg, {
                    title: errorMessages.title,
                    style: 'error',
                    stem: 'topLeft',
                    hook: { tip: 'topLeft', mouse: true },
                    offset: { x: 10, y: 10 }
                });
                */
            } else {
                input.removeClassName('myuiErrorInput');
                divHint.removeClassName('myuiErrorIcon');
            }
        }
    }
});
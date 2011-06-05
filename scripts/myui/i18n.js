var i18n = {};

i18n['EN'] = {};
i18n['EN']['error.required.field'] = '#{field} is required';
i18n['EN']['error.invalid.creditCard'] = 'value #{value} is not a valid credit card number';
i18n['EN']['error.invalid.range'] = 'value #{value} does not fall within the valid range from #{from} to #{to}';
i18n['EN']['error.invalid.size'] = 'value #{value} does not fall within the valid size range from #{from} to #{to}';
i18n['EN']['error.invalid.max'] = 'value #{value} exceeds maximum value #{max}';
i18n['EN']['error.invalid.min'] = 'value #{value} is less than minimum value #{min}';
i18n['EN']['error.invalid.max.size'] = 'value #{value} exceeds the maximum size of #{max}';
i18n['EN']['error.invalid.min.size'] = 'value #{value} is less than the minimum size of #{min}';

i18n['ES'] = {};
i18n['ES']['error.required.field'] = '#{field} debe ser ingresado';
i18n['ES']['error.invalid.creditCard'] = 'valor #{value} no es un numero de targeta valido';
i18n['ES']['error.invalid.range'] = 'valor #{value} esta fuera del rango desde #{from} hasta #{to}';
i18n['ES']['error.invalid.size'] = 'valor #{value} no es un tamano valido entre #{from} a #{to}';
i18n['ES']['error.invalid.max'] = 'valor #{value} excede el maximo valor #{max}';
i18n['ES']['error.invalid.min'] = 'valor #{value} es menos que el minimo permitido #{min}';
i18n['ES']['error.invalid.max.size'] = 'valor #{value} excede el maximo tamano de #{max}';
i18n['ES']['error.invalid.min.size'] = 'valor #{value} es menos que el minimo tamano de #{min}';

i18n.getMessage = function(messageId, options) {
    options = options || {};
    var result = messageId;
    var languageCd = navigator.language.substring(0,2).toUpperCase();
    try {
        var messages = this[languageCd] || this['EN'];
        if (messages[messageId]) {
            var template = new Template(messages[messageId]);
            return template.evaluate(options);
        }
    } catch(e) {
        result = messageId;
    }
    return result;
};

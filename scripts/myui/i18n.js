var i18n = {};

i18n['EN'] = {};
i18n['EN']['label.ok'] = 'OK';
i18n['EN']['label.now'] = 'Now';
i18n['EN']['label.today'] = 'Today';
i18n['EN']['label.clear'] = 'Clear';
i18n['EN']['label.add'] = 'Add';
i18n['EN']['label.delete'] = 'Delete';
i18n['EN']['label.save'] = 'Save';
i18n['EN']['label.sortAsc'] = 'Sort ascending';
i18n['EN']['label.sortDesc'] = 'Sort descending';
i18n['EN']['label.selectAll'] = 'Select all';
i18n['EN']['label.loading'] = 'Loading ...';
i18n['EN']['message.totalDisplay'] = '<strong><span id="mtgTotal">#{total}</span></strong> records found';
i18n['EN']['message.rowsDisplay'] = ', displaying <strong><span id="mtgFrom">#{from}</span></strong>&nbsp;to&nbsp;<strong><span id="mtgTo">#{to}</span></strong>';
i18n['EN']['message.pagePrompt'] = '<td><strong>Page:</strong></td><td>#{input}</td><td>of&nbsp;<strong>#{pages}</strong></td>';
i18n['EN']['message.noRecordFound'] = '<strong>No records found</strong>';
i18n['EN']['error.required.field'] = '#{field} is required';
i18n['EN']['error.invalid.creditCard'] = 'value #{value} is not a valid credit card number';
i18n['EN']['error.invalid.range'] = 'value #{value} does not fall within the valid range from #{from} to #{to}';
i18n['EN']['error.invalid.size'] = 'value #{value} does not fall within the valid size range from #{from} to #{to}';
i18n['EN']['error.invalid.max'] = 'value #{value} exceeds maximum value #{max}';
i18n['EN']['error.invalid.min'] = 'value #{value} is less than minimum value #{min}';
i18n['EN']['error.invalid.max.size'] = 'value #{value} exceeds the maximum size of #{max}';
i18n['EN']['error.invalid.min.size'] = 'value #{value} is less than the minimum size of #{min}';

i18n['ES'] = {};
i18n['ES']['label.ok'] = 'OK';
i18n['ES']['label.now'] = 'Ahora';
i18n['ES']['label.today'] = 'Hoy';
i18n['ES']['label.clear'] = 'Limpiar';
i18n['ES']['label.add'] = 'Agregar';
i18n['ES']['label.delete'] = 'Eliminar';
i18n['ES']['label.save'] = 'Grabar';
i18n['ES']['label.sortAsc'] = 'Ordenar asc';
i18n['ES']['label.sortDesc'] = 'Ordenar desc';
i18n['ES']['label.selectAll'] = 'Seleccionar todo';
i18n['ES']['label.loading'] = 'Espere ...';
i18n['ES']['message.totalDisplay'] = '<strong><span id="mtgTotal">#{total}</span></strong> filas encontradas';
i18n['ES']['message.rowsDisplay'] = ', mostrando <strong><span id="mtgFrom">#{from}</span></strong>&nbsp;a&nbsp;<strong><span id="mtgTo">#{to}</span></strong>';
i18n['ES']['message.pagePrompt'] = '<td><strong>P&aacute;gina:</strong></td><td>#{input}</td><td>de&nbsp;<strong>#{pages}</strong></td>';
i18n['ES']['message.noRecordFound'] = '<strong>No hay filas</strong>';
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
    var language = window.navigator.userLanguage || window.navigator.language;
    var languageCd = language.substring(0,2).toUpperCase();
    languageCd = 'ES'; // TODO remove
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

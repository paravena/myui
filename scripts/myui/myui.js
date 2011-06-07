var MyUI = {
    Version: '1.1.0',
    require: function(libraryName) {
        try {
            // inserting via DOM fails in Safari 2.0, so brute force approach
            document.write('<script type="text/javascript" src="' + libraryName + '"><\/script>');
        } catch(e) {
            // for xhtml+xml served content, fall back to DOM methods
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = libraryName;
            document.getElementsByTagName('head')[0].appendChild(script);
        }
    },

    REQUIRED_PROTOTYPE: '1.6',
    load: function() {
        function convertVersionString(versionString) {
            var v = versionString.replace(/_.*|\./g, '');
            v = parseInt(v + '0'.times(4 - v.length));
            return versionString.indexOf('_') > -1 ? v - 1 : v;
        }

        if ((typeof Prototype == 'undefined') ||
                (typeof Element == 'undefined') ||
                (typeof Element.Methods == 'undefined') ||
                (convertVersionString(Prototype.Version) <
                        convertVersionString(MyUI.REQUIRED_PROTOTYPE)))
            throw("MyUI requires the Prototype JavaScript framework >= " +
                    MyUI.REQUIRED_PROTOTYPE);

        var js = /myui\.js(\?.*)?$/;
        $$('head script[src]').findAll(function(s) {
            return s.src.match(js);
        }).each(function(s) {
            var path = s.src.replace(js, '');
            var includes = s.src.match(/\?.*load=([a-z,]*)/);
            (includes ? includes[1] : 'Utilities,i18n,ToolTip,TextField,Date,DatePicker,TableGrid,KeyTable,controls,Autocompleter,ComboBox').split(',').each(
                function(include) {
                    MyUI.require(path + include + '.js');
            });
        });
    }
};
MyUI.load();
var MY = {};
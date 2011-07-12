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
var MyUI = {
    Version: '1.0',
    REQUIRED_PROTOTYPE: '1.6',

    requireLibrary: function(libraryName) {
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

    requireCSS: function(cssDefinitionFile) {
        try {
            // inserting via DOM fails in Safari 2.0, so brute force approach
            document.write('<link type="text/css" href="'+cssDefinitionFile+'" rel="stylesheet">');
        } catch(e) {
            // for xhtml+xml served content, fall back to DOM methods
            var cssDef = document.createElement('link');
            cssDef.type = 'text/css';
            cssDef.href = cssDefinitionFile;
            document.getElementsByTagName('head')[0].appendChild(cssDef);
        }
    },

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
                    MyUI.requireLibrary(path + include + '.js');
            });
            path = path.replace('scripts', 'css');
            'myui,ToolTip,TextField,DatePicker,TableGrid,Autocompleter'.split(',').each(
                function(include) {
                    MyUI.requireCSS(path + include + '.css');
            });
        });
    }
};
MyUI.load();
var MY = {};
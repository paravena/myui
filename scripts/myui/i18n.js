/*****************************************************************************
 *
 * Copyright (c) 2004 Guido Wesdorp. All rights reserved.
 *
 * This software is distributed under the terms of the i18n.js
 * License. See LICENSE.txt for license text.
 *
 *****************************************************************************/

var MessageCatalog = Class.create({
    /* Simple i18n registry

        An XML island is used to produce a mapping from msgid to phrase,
        the phrase can optionally contain interpolation terms in the format
        ${name}. Each string in the application should be retrieved from
        this object using the 'translate' method with the msgid as argument,
        optionally called with a mapping (object) from name to value which
        will be used for the interpolation. Example:

        Say we have the following XML island (note that this also serves as
        an example for the format):

        <xml id="i18n">
          <i18n language="en">
            <foo>bar</foo>
            <someline>this is a ${type} line</someline>
          </i18n>
        </xml>

        we can create an MessageCatalog object like this:

        var mc = new MessageCatalog();
        mc.initialize(document, 'i18n');

        and can then make the following calls:

        mc.translate('foo'); # would result in 'bar'
        mc.translate('someline', {'type': 'short'}); # 'this is a short line'

    */

    initialize : function(doc, elid) {
        this.mapping = {};
        /*
            load the mapping from XML
            if you don't call this function, no translation will be done,
            but the object is still usable
        */
        this.mapping = this.getCatalogFromXML(doc, elid);
    },

    getCatalogFromXML : function(doc, elid) {
        /*
            Parse the message catalog XML
            If called with a single arg, that arg should be some XML document.
            If called with 2 args, the first one is the HTML 'document' and
            the second the id of the XML element containing the message catalog.
        */
        if (elid) {
            doc = doc.getElementById(elid);
        }
        var mapping = {};
        var items = doc.getElementsByTagName('message');
        for (var i=0; i < items.length; i++) {
            var msgid = this.getTextFromNode(items[i].getElementsByTagName('msgid')[0]);
            mapping[msgid] = this.getTextFromNode(items[i].getElementsByTagName('msgstr')[0]);
        }
        return mapping;
    },

    getTextFromNode : function(node) {
        /* returns the text contents of a single, not-nested node */
        var text = '';
        for (var i=0; i < node.childNodes.length; i++) {
            var child = node.childNodes[i];
            if (child.nodeType != 3) {
                continue;
            }
            text += child.nodeValue.reduceWhitespace().strip();
        }
        return text;
    },

    translate : function(msgid, interpolations) {
        var translated = this.mapping[msgid];
        if (!translated) {
            translated = msgid;
        }
        if (interpolations) {
            for (var id in interpolations) {
                var value = interpolations[id];
                var reg = new RegExp('\\\$\\\{' + id + '\\\}', 'g');
                translated = translated.replace(reg, value);
            }
        }
        return translated;
    }
});

var HTMLTranslator = Class.create({
    initialize : function() {
        /*
            finds Zope-style messageids in the HTML and translates them
            tries to be completely compatible to allow using Zope tools etc.
        */
    },

    translate : function(doc, catalog) {
        this.doc = doc;
        if (!catalog) {
            catalog = window.i18n_message_catalog;
        }
        this.catalog = catalog;
        var docel = doc.documentElement;
        var iterator = new NodeIterator(docel);
        while (true) {
            var node = iterator.next();
            if (!node) {
                break;
            }
            this.handleNode(node);
        }
    },

    handleNode : function(node) {
        var t = null;
        var a = null;
        if (document.all) {
            /* find out if the node contains i18n attrs and if so handle them

                it seems that the only way to not make IE barf on getAttributes
                if an attribute doesn't exist (hasAttribute sometimes reports it's
                there when it's not) is use a try block, but it slows Moz down
                like crazy, hence the two different methods
            */
            if (node.nodeType != 1) {
                return;
            }
            try {
                t = node.getAttribute('i18n:translate');
                this.handle_i18n_translate(node, t);
            } catch(e) {
                // IE seems to barf on certain node types
            }

            try {
                a = node.getAttribute('i18n:attributes');
                this.handle_i18n_attributes(node, a);
            } catch(e) {
            }
        } else {
            /* find out if the node contains i18n attrs and if so handle them */
            if (node.nodeType != 1) {
                return;
            }
            if (node.hasAttribute('i18n:translate')) {
                t = node.getAttribute('i18n:translate');
                this.handle_i18n_translate(node, t);
            }
            if (node.hasAttribute('i18n:attributes')) {
                a = node.getAttribute('i18n:attributes');
                this.handle_i18n_attributes(node, a);
            }
        }
    },

    handle_i18n_translate : function(node, midstring) {
        var mid;
        if (midstring.strip() != '') {
            mid = midstring;
        } else {
            mid = node.innerHTML;
        }
        mid = mid.strip().reduceWhitespace();
        node.innerHTML = this.catalog.translate(mid);
    },

    handle_i18n_attributes : function(node, attrstring) {
        var attrnames = attrstring.split(';');
        for (var i=0; i < attrnames.length; i++) {
            var attr = node.getAttribute(attrnames[i]).strip();
            node.setAttribute(attrnames[i], this.catalog.translate(attr));
        }
    }
});

var ContextFixer = Class.create({
    initialize : function(func, context) {
        /* Make sure 'this' inside a method points to its class */
        this.func = func;
        this.context = context;
        this.args = arguments;
        var self = this;

        this.execute = function() {
            /* execute the method */
            var i = 0;
            var args = new Array();
            // the first arguments will be the extra ones of the class
            for (i = 0; i < self.args.length - 2; i++) {
                args.push(self.args[i + 2]);
            }
            // the last are the ones passed on to the execute method
            for (i = 0; i < arguments.length; i++) {
                args.push(arguments[i]);
            }
            return self.func.apply(self.context, args);
        }
    }
});

var NodeIterator = Class.create({
    initialize : function(node , continueatnextsibling) {
        /* simple node iterator

            can be used to recursively walk through all children of a node,
            the next() method will return the next node until either the next
            sibling of the startnode is reached (when continueatnextsibling is
            false, the default) or when there's no node left (when
            continueatnextsibling is true)

            returns false if no nodes are left
        */
        this.node = node;
        this.current = node;
        this.terminator = continueatnextsibling ? null : node;
    },
    next : function() {
        /* return the next node */
        if (!this.current) {
            // restart
            this.current = this.node;
        }
        var current = this.current;
        if (current.firstChild) {
            this.current = current.firstChild;
        } else {
            // walk up parents until we finish or find one with a nextSibling
            while (current && current != this.terminator && !current.nextSibling) {
                current = current.parentNode;
            }
            if (!current || current == this.terminator) {
                this.current = false;
            } else {
                this.current = current.nextSibling;
            }
        }
        return this.current;
    },

    reset : function() {
        /* reset the iterator so it starts at the first node */
        this.current = this.node;
    },

    setCurrent : function(node) {
        /* change the current node

            can be really useful for specific hacks, the user must take
            care that the node is inside the iterator's scope or it will
            go wild
        */
        this.current = node;
    }
});

String.prototype.reduceWhitespace = function() {
    /* returns a string in which all whitespace is reduced
        to a single, plain space */
    var spacereg = /(\s+)/g;
    var copy = this;
    while (true) {
        var match = spacereg.exec(copy);
        if (!match) {
            return copy;
        }
        copy = copy.replace(match[0], ' ');
    }
};

// instantiate a global MessageCatalog for all scripts to use
window.i18n_message_catalog = new MessageCatalog();
// make a gettext-style _ function globally available
window._ = new ContextFixer(window.i18n_message_catalog.translate, window.i18n_message_catalog).execute;

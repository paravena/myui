var swm_util_makeMtgCombo = Class.create();

swm_util_makeMtgCombo.prototype = {
	initialize: function(url, flds) {
  	this.url = url;
    this.flds = flds;
    },

	getObj: function() {
  	var ret = new Array();
    var idx = new Array();
    var flds = this.flds;
    var self = this;
    var obj =    {
        data: [
        ['BIKING-L','F-Biking Inquiries','Group size','','','','','M','','','','','Y','Y'],
        ['RAFTINGB','B-Black Rafting Inquiries','Group size','','','','','M','','','','','Y','Y'],
        ['RAFTINGH','C-Hudson Rafting Inquiries','Group size','','','','','M','','','','','Y','Y'],
        ['RAFTINGL','A-Lehigh Rafting Inquiries','Group size','','','','','M','','','','','Y','Y'],
        ['RAFTINGM','D-Moose Rafting Inquiries','Group size','','','','','M','','','','','Y','Y'],
        ['RAFTINGS','E-Salmon Rafting Inquiries','Group size','','','','','M','','','','','Y','Y'],
        ['RESSIE','1-A Any Lehigh Ressie','','','','','','R','','','','','Y','N'],
        ['RESSIENY','1-B Any NY Ressie','','','','','','R','','','','','Y','N']
        ],
        fields: ['stream','desc','info1','info2','info3','info4','info5','mr','inqlisti','inqliste','prflisti','prfliste','active','dumprsv']
        };



    var fields = obj['fields'];
    var data = obj['data'];

    // get field indexes
    for (f = 0; f < flds.length; f++) {
        idx[f] = fields.findIndex(flds[f]);
    }

    // build array
    for (var i = 0; i < data.length; i++) {
        var obj = {};

      for (var j = 0; j < flds.length; j++) {
        obj[flds[j]] = data[i][idx[j]];
      }

      ret[ret.length] = obj;
    }
	self.ret = ret;
  return ret;
  },

  find: function(value) {
  	var obj = this.ret;
  	var fld = this.flds[0];
  	var data = this.flds[1];

  	for (i=0; i<obj.length; i++) {
  		if (obj[i][fld]==value)
  			return obj[i][data];
  	}

  	return "";
  }
};

function swm_util_commitMtgChanges(rows, url, params) {
	var ret = true;
	var temp = Object.toJSON(rows);

	var qs = encodeURIComponent(temp);
	params['data'] = qs;

	// submit
  new Ajax.Request(url, {
  	method: 'post',
  	parameters: params,
    asynchronous: false,
    onSuccess: function(transport) {
    	var obj = transport.responseText.evalJSON();
      ret = obj['success'] || false;
      if (ret == false)
     		return ret;
    },
    onFailure: function() {
    	ret = false;
     	return ret;
    },
    onException: function() {
     	ret = false;
     	return ret;
     }
  });

	return ret;
}
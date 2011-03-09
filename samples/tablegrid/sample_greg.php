<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
        "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
    <title>TableGrid Last Version</title>
    <!--<meta http-equiv="X-UA-Compatible" content="chrome=1">-->
    <link type="text/css" href="../../css/main.css" rel="stylesheet">
    <link type="text/css" href="../../css/myui/tablegrid.css" rel="stylesheet">
    <link type="text/css" href="../../css/myui/calendar.css" rel="stylesheet">
    <script type="text/javascript" src="../../scripts/lib/prototype/back/prototype.js"></script>
    <script type="text/javascript" src="../../scripts/lib/scriptaculous/scriptaculous.js"></script>
    <script type="text/javascript" src="../../scripts/lib/myui/myui.js"></script>
    <script type="text/javascript" src="mtgutil.js"></script>
</head>
<script type="text/javascript">
    Array.prototype.findIndex = function(value){
        for (var i=0; i < this.length; i++) {
            if (this[i] == value)
                return i;
        }
        return "";
    };

    var fustrm1Cmb = new swm_util_makeMtgCombo("http://www.adventurebooking.com/json/fustrm1.json", ['stream','desc'])
    var fustrm1Combo = fustrm1Cmb.getObj();

    var cuprefGrid, cuemlgrp = null;

    var cuprefGridModel = {
        options : {
            title: 'Preferences',
            toolbar : {
                elements: [MyTableGrid.ADD_BTN, MyTableGrid.DEL_BTN, MyTableGrid.SAVE_BTN],
                onSave: function() {
                    var params = {}
                    params['file']='cupref';
                    // New Rows
                    var rows = cuprefGrid.getNewRowsAdded();
                    if (rows.length > 0) {
                        params['action']='gridsave';
                        var ret = swm_util_commitMtgChanges(rows, '/cgi/r3cusetup', params);
                        if (ret==false)
                            alert("Saving Additions Failed");
                    };

                    // Changes
                    var rows = cuprefGrid.getModifiedRows();
                    if (rows.length > 0) {
                        params['action']='gridmod';
                        var ret = swm_util_commitMtgChanges(rows, '/cgi/r3cusetup', params);
                        if (ret==false)
                            alert("Saving Changes Failed");
                    };

                    // Deletions
                    var rows = cuprefGrid.getDeletedRows();
                    if (rows.length > 0) {
                        params['action']='griddel';
                        var ret = swm_util_commitMtgChanges(rows, '/cgi/r3cusetup', params);
                        if (ret==false)
                            alert("Saving Deletions Failed");
                    };
                },

                onAdd: function() {
                    //alert('on add handler');
                },

                onDelete: function() {
                    //alert('on delete handler');
                }
            },

            rowClass : function(rowIdx) {
                var className = '';
                if (rowIdx % 2 == 0)
                    className = 'hightlight';
                return className;
            }
        },

        columnModel: [
            {
                id: 'code',
                title: 'Del',
                width: 30,
                editable: true,
                editor: new MyTableGrid.CellCheckbox({
                    selectable : true
                })
            },
            {
                id: 'desc',
                title: 'Description',
                editable: true,
                sortable: false, 
                children:[
                    {id:'desc1', title: 'Desc 1', editable: true, width: 140},
                    {id:'desc2', title: 'Desc 2', editable: true, width: 140}
                ]

            },
            {
                id: 'webable',
                title: 'Webable',
                width: 70,
                editable: true,
                sortable: true,
                editor: new MyTableGrid.CellCheckbox({
                    getValueOf: function(value) {
                        var result = 'N';
                        if (value) result = 'Y';
                        return result;
                    }
                })
            },
            {
                id: 'stream',
                title: 'Stream',
                width: 200,
                editable: true,
                sortable: true,
                editor: new MyTableGrid.ComboBox({
                    list: fustrm1Combo,
                    listTextPropertyName: 'desc',
                    listValuePropertyName: 'stream'
                }),
                renderer: function(value) {
                    return(fustrm1Cmb.find(value));
                }
            }
        ],
        rows: [
            ['','new2','N','N',''],
            ['1','Family Vacation','N','Y','RAFTINGM'],
            ['10','New Desc','Y','Y',''],
            ['11','Adventure Travel','N','N',''],
            ['12','Downhill Skiing','Y','Y',''],
            ['1234','Family Vacation 1234','Y','N',''],
            ['12A','Downhill Skiing','Y','Y',''],
            ['13','Sea Kayaking','Y','N',''],
            ['14','Meetings & Conferences','Y','N',''],
            ['15','Bird Hunting','Y','Y',''],
            ['16','Ropes Course','Y','N',''],
            ['17','Sportyaking','Y','N',''],
            ['18','Project Graduation','Y','N',''],
            ['19','Outing Club','Y','N',''],
            ['2','Snowmobilingeristh','Y','N','RAFTINGS'],
            ['20','Rock Climbing','Y','N',''],
            ['21','Windjamming Cruises','Y','N',''],
            ['22','Snowmobile Rental','Y','N',''],
            ['23','Snwmb Rntl & Guided Tours','Y','N',''],
            ['24','CANOEING','Y','N',''],
            ['25','Float Trips','Y','N',''],
            ['26','Maine Guide School','Y','N',''],
            ['27','Summer Camp','Y','N',''],
            ['28','Kayak school','Y','N',''],
            ['29','School orientation programs','Y','N',''],
            ['3','Rafting','Y','N',''],
            ['30','Wilderness hiking','Y','N',''],
            ['31','Adult programs','N','N',''],
            ['4','Learning Thru Adventure','Y','N',''],
            ['5','Deer Hunting','Y','N',''],
            ['6','Fishing','Y','N',''],
            ['7','Horseback Riding','Y','N',''],
            ['8','Corporate Retreats','Y','N',''],
            ['9','Mountain Biking','Y','N',''],
            ['DSKI','Downhill Skiing','Y','Y',''],
            ['HI','Hiking','N','N',''],
            ['MB','Mountain Biking','Y','N',''],
            ['MC','Mountain Climbing','Y','Y',''],
            ['R','Rafting','Y','N',''],
            ['RA','Rafting','Y','N',''],
            ['SK','skiing','Y','N',''],
            ['WWR','Whitewater Rafting','Y','Y',''],
            ['WWS','new','N','N',''],
            ['WWT','new2','N','N','']
        ]
    };

    window.onload = function() {
    	cuprefGrid = new MyTableGrid(cuprefGridModel);
        cuprefGrid.render('mytable1');
    };
</script>
<body>
    <div class="container">
        <div class="samples">
            <h1>TableGrid Last Version</h1>
            <div id="mytable1" style="position:relative; width: 640px; height: 350px"></div>
            <div class="autocomplete" id="list" style="display:none;z-index:1000"></div>
        </div>
    </div>
</body>
</html>
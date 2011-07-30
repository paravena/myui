<?php
    header('Content-type: application/json');

    $rowsByPage = 10;
    $page = 1;
    if (isset($_REQUEST['page']))
        $page = $_REQUEST['page'];
    $sort = 'model';
    if (isset($_REQUEST['sortColumn']))
        $sort = $_REQUEST['sortColumn'];
    $ascDescFlg = 'ASC';
    if (isset($_REQUEST['ascDescFlg']))
        $ascDescFlg = $_REQUEST['ascDescFlg'];
    
    $sortColumn = 'manuf_name'; 
    if ($sort == 'year') 
        $sortColumn = 'model_year';
    else if ($sort == 'model') 
        $sortColumn = 'model_name';
    else if ($sort == 'price')    
        $sortColumn = 'car_ask_price';

    $con = mysql_connect("localhost", "paravena", "pablo123");
    
    if (!$con)  {
        die('Could not connect: ' . mysql_error());
    }
    
    mysql_select_db("jawdb", $con);

    $query = 'select count(1) ' .
             'from CARS_FOR_SALE cfs, ' .
             '     CAR_MODELS cm, ' .
             '     MANUFACTURERS m ' .
             'where cfs.model_id = cm.model_id and ' .
             'cm.manuf_id = m.manuf_id';

    $result = mysql_query($query);
    $row = mysql_fetch_array($result);
    $count = $row[0];

    $numberOfPages = 0;
    $from = 0;
    $to = 0;
    $rows = array();
    $json_result = '';
        
    if ($count > 0) {
        $numberOfPages = floor($count / $rowsByPage); 
        if (($count % $rowsByPage) > 0) $numberOfPages++;
        if ($page > $numberOfPages) $page = $numberOfPages;
        $from = (($page - 1) * $rowsByPage);
        $to = ($page * $rowsByPage) - 1;
        if ($to > $count) $to = $count; 
    
        $query = 'select a.* from ( '.
                 'select m.manuf_name, ' .
                 '       cm.model_id, ' .
                 '       cm.model_name, ' .
                 '       cm.model_year, ' .
                 '       cfs.car_id, ' .
                 '       cfs.car_ask_price ' .
                 'from CARS_FOR_SALE cfs, ' .
                 '     CAR_MODELS cm, ' .
                 '     MANUFACTURERS m ' .
                 'where cfs.model_id = cm.model_id and ' .
                 'cm.manuf_id = m.manuf_id ' .
                 'order by ' . $sortColumn . ' ' . $ascDescFlg . ') a ' .
                 'limit ' . $from . ',' . $to;
    
        $result = mysql_query($query);
        $idx = 0;
        $json_result = '[';
        while($row = mysql_fetch_array($result)) {
            if ($idx > 0) $json_result .= ',';
            $json_result .= '["'.$row['car_id'] .'","'. $row['manuf_name'].'","'. $row['model_name'].'","'. $row['model_year'].'","'. $row['car_ask_price'].'","07/22/2011","US"]';
            $idx++;
        }
        $json_result .= ']';
    } 
    mysql_close($con);
?>
{
    "options": {
        "pager": {
            "currentPage": "<?php echo $page?>",
            "total": "<?php echo $count?>",
            "from": "<?php echo ($from + 1)?>",
            "to": "<?php echo ($to + 1)?>",
            "pages": "<?php echo $numberOfPages?>"
        }
    },
    "rows" : <?php echo $json_result; ?>
}
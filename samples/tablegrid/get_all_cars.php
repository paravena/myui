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

    $con = mysql_connect("localhost", "root", "admin");
    
    if (!$con)  {
        die('Could not connect: ' . mysql_error());
    }
    
    mysql_select_db("jawdb", $con);

    $query = 'select count(1) ' .
             'from cars_for_sale cfs, ' .
             '     car_models cm, ' .
             '     manufacturers m ' .
             'where cfs.model_id = cm.model_id and ' .
             'cm.manuf_id = m.manuf_id';

    $result = mysql_query($query);
    $row = mysql_fetch_array($result);
    $count = $row[0];

    $numberOfPages = 0;
    $from = 0;
    $to = 0;
    $rows = array();
    
    if ($count > 0) {
        $numberOfPages = floor($count / $rowsByPage); 
        if (($count % $rowsByPage) > 0) $numberOfPages++;
        if ($page > $numberOfPages) $page = $numberOfPages;
        $from = (($page - 1) * $rowsByPage);
        $to = ($page * $rowsByPage);
        if ($to > $count) $to = $count; 
        
        $query = 'select a.* from ( '.
                 'select m.manuf_name, ' .
                 '       cm.model_id, ' .
                 '       cm.model_name, ' .
                 '       cm.model_year, ' .
                 '       cfs.car_id, ' .
                 '       cfs.car_ask_price, ' .
                 '       date_format(ifnull(cfs.car_date_acquired, now()), \'%m/%d/%Y\') car_date_acquired ' .
                 'from cars_for_sale cfs, ' .
                 '     car_models cm, ' .
                 '     manufacturers m ' .
                 'where cfs.model_id = cm.model_id and ' .
                 'cm.manuf_id = m.manuf_id ' .
                 'order by ' . $sortColumn . ' ' . $ascDescFlg . ') a ' .
                 'limit ' . $from . ',' . $to;
    
        $result = mysql_query($query);
        $rows = array();
        $idx = 0;
        
        while($row = mysql_fetch_array($result)) {
            $rows[$idx++] = array('carId' => $row['car_id'], 'manufacturer' => $row['manuf_name'], 'model' => $row['model_name'], 'year' => $row['model_year'], 'price' => $row['car_ask_price'], 'dateAcquired' => $row['car_date_acquired'], 'manuf_name' => $row['model_name']);
        }
    } 
    mysql_close($con);
?>
{
    "options" : {
        "pager": {
            "currentPage": "<?php echo $page?>",
            "total": "<?php echo $count?>",
            "from": "<?php echo ($from + 1)?>",
            "to": "<?php echo ($to + 1)?>",
            "pages": "<?php echo $numberOfPages?>"
        }
    },
    "rows" : <?php print json_encode($rows); ?>
}
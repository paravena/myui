<?php
    header('Content-type: application/json');
    $manuf_id = null;
    if(isset($_REQUEST['manuf_id'])) {
        $manuf_id = $_REQUEST['manuf_id'];
    }

    $con = mysql_connect("localhost", "root", "admin");
    
    if (!$con)  {
        die('Could not connect: ' . mysql_error());
    }
    
    mysql_select_db("jawdb", $con);


    $query = 'select * from car_models where manuf_id = ' . $manuf_id;
    
    $result = mysql_query($query);
    $rows = array();
    $idx = 0;
        
    while($row = mysql_fetch_array($result)) {
        $rows[$idx++] = array('value' => $row['model_id'], 'text' => $row['model_name']);
    }
    mysql_close($con);
?>
<?php print json_encode($rows); ?>

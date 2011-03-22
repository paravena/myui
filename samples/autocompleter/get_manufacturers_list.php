<?php
    header('Content-type: application/json');

    $con = mysql_connect("localhost", "root", "admin");
    
    if (!$con)  {
        die('Could not connect: ' . mysql_error());
    }
    
    mysql_select_db("jawdb", $con);


    $query = 'select * from manufacturers';
    
    $result = mysql_query($query);
    $rows = array();
    $idx = 0;
        
    while($row = mysql_fetch_array($result)) {
        $rows[$idx++] = array('value' => $row['manuf_id'], 'text' => $row['manuf_name']);
    }
    mysql_close($con);
?>
<?php print json_encode($rows); ?>

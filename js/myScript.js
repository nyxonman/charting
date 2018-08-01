if(TEST_HW){
    console.log("~~~~~~~~~~~~~~ ATMEL (v"+CHART_VERSION+") ~~~~~~~~~~~~~~");
}else{
    console.log("~~~~~~~~~~~~~~ COOJA (v"+CHART_VERSION+")~~~~~~~~~~~~~~");
}

console.log("len clock TSN node_id seq_id cur_power etx ewma_etx total_sent total_tx_energy cca mod PL avgPL neighs rssi dataMsg ");
console.log("Data Rate: " + DATA_RATE + "kbps Data Size: " + DATA_SIZE + "bytes TimePerPkt: " + TIME_PER_PKT +"secs");

//GLOBAL CONSTANTS
var startCollect          = false;
var numOfNodes            = 0;
var numOfNodesAfterFilter = 0;
var curLineNum            = 0;
var lastLineNum           = 0;
var startDate             = 0;
var filteredNodes         = [];
var NodesBackup           = [];
var first                 = true;
var RX_LIMIT              = 0;
var TPC                   = 0;
var RATE                  = 0;
var offEndTime            = 0;

/*initialize the multi-dimensional array*/
var nodeArray      = [];
var nodeCountArray = [];
var TSN_TX         = [];
// $('#loading').hide()
$(document).ready(function(){
    
    var fullLogArray   = new Array();
    var timeArray      = new Array();
    var powerArray     = new Array();
    intervalId         = 0;
    var updateInterval = 0;

    // external file handler
    var filename = $('#logFileSelect').val().split('\\').pop();
    setRxLimit();
    LOG_FILE_NAME=filename==""?LOG_FILE_NAME:filename;
    console.log("LogFile : "+LOG_FILE_NAME);
    var splitArray=new Array();
    splitArray = LOG_FILE_NAME.split('_');
    var date=splitArray[5];
    var time=splitArray[6]
    
    var dateStr="";
    dateStr=filename==""?filename: date.substring(0,2) +"/"+date.substring(2,4)+"/"+date.substring(4)+", "+time.substring(0,2)+":"+time.substring(2,4)+":"+time.substring(4,6);
    console.log("date " + dateStr);

    // console.log("ajaxGetData");
    ajaxGetData(function(output){
        //console.log("FILTERED ")
         // console.log(output);

        // set the date and the initial timestamp.
       setDateTimeNow(dateStr);
       setInitTimeStamp();

       // this is later used in updateChart to know if there is a change
       lastLineNum = curLineNum;
       processData(output);

       $(".myTabs").tabs({
            create: function (event, ui) {
                //Render Charts after tabs have been created.

                //prepare the datasets
                $.each( charts, function( key, row ) {
                    charts[key] = drawChart(chartTypes[key],key, datasets[key], false)
                });

                // for the first time create the etx chart which is first in the display
                charts["etx"].render();


            },
            activate: function (event, ui) {
                //Updates the chart to its container size if it has changed.
                var myTabId = ui.newPanel.children().first().attr("id");
                updateInterval = parseInt($("#updateInterval").val()) * parseInt($("#updateIntervalType").val()) * 1000;

                if(intervalId!=0) clearInterval(intervalId);

                // draw only only the active tab chart
                charts[myTabId] = drawChart(chartTypes[myTabId], myTabId, datasets[myTabId],true);
                if (startCollect==true)
                    intervalId = setInterval(function(){updateChart(false)}, updateInterval);
                $("#myDataTable").html("");
                if(dataTableOption[myTabId]){
                    insertDataTable(myTabId, datasets[myTabId]);
                    updateFinalStats(datasets[myTabId]);

                }
            }
            // end of activate function
        });
       // end of myTabs function

    });
    // end of ajaxGetData

 });
// end of $document.ready

$(document).ready(function(){
    $('a[data-toggle="pill"]').on('shown.bs.tab', function (e) {
        // e.target // newly activated tab
        // e.relatedTarget // previous active tab
        $(".tab-pane.fade.active.show .ui-tabs-active.ui-state-active").each(function(key,element){
                var attr  = $(this).attr("aria-controls");
                var tabId = attr.substr(attr.indexOf('-')+1, attr.length);
                charts[tabId].render();
        });
    })
    // end of pill on show
});

function constructFilter(){

    var myHtml    = "";
    var filterCnt = 0;
    $.each(nodeCountArray, function(key,value){
         if(value > 0){
            filteredNodes[filterCnt++] = key;
             myHtml += "<li><input type='checkbox' checked='checked' value=" + key + " /> Node " + key + "</li>" ;
         }
    });
    numOfNodesAfterFilter = filterCnt;
    NodesBackup           = filteredNodes;

    // fill the html with the nodes numbers
    $(".mutliSelect ul").html(myHtml).ready(function(){
        $('.dropdown #multiSelect input[type="checkbox"]').on('click', function() {

            var node = $(this).val();

            if ($(this).is(':checked')) {
                filteredNodes.push(parseInt(node));
                updateChart(true);
                // console.log("added "  +node + " newFilter " + filteredNodes);

            } else {
                filteredNodes = $.grep(filteredNodes, function(value){
                return value != node;
            });
            updateChart(true);
            }
        });
        /*end of on click of check box*/
    });
    /*end of .html.ready function*/
}

/**
 * to insert the data table for each graph
 * @param  {[type]} id        tabID
 * @param  {[type]} chartData data of the current tab
 */
function insertDataTable(id, chartData){
    var table="";
    table+="<div class='row'>"

   table+='<div class="col-sm-2">'
    table+='<table class="table  table-sm table-bordered table-striped table-responsive">'
    table+='<caption>' + id + ' Data Table</caption>'
    table+='<thead><tr><th scope="col">Node</th><th scope="col">X</th></thead><tbody>';

    $.each( chartData[0].dataPoints, function( index, row ){
        table+='<tr>';
        table+='<td>'+ row.label +'</td>'
        table+='<td>'+ row.x +'</td>'
        table+='</tr>';  
   });
   table+='</tbody></table>'
   table+='</div>'

    // for multiple
    $.each( chartData, function( index, object ){
        table+='<div class="col-sm-2">'
        table+='<table class="table  table-sm table-bordered table-striped table-responsive">'
        table+='<thead><tr><th scope="col">'+object.legendText+'</th></thead><tbody>';
        // process each rows
        $.each(object.dataPoints, function(key, row){
            table+='<tr>';
            table+='<td>'+ row.y +'</td>'
            table+='</tr>';    
        });
        table+='</tbody></table>';
        table+='</div>'

    });
    table+="</div>" // for the row

    $("#myDataTable").html(table);
}

function updateFinalStats(dataObj){
    console.log(dataObj);

    var min     = 123456789101112131415;
    var max     = 0;
    var total   = 0;
    var average = 0;
    var cnt     = 0;
    var minStr= " ", maxStr= " ", totalStr= " ", averageStr = " ";

    $.each(dataObj,function(key, one){
        cnt = dataObj[0].dataPoints.length;
        if (dataObj[0].type == "column" || dataObj[0].type == "stackedColumn"){
            $.each(dataObj[0].dataPoints, function(id, row){
                min   = (row.y < min)? row.y : min;
                max   = (row.y > max)? row.y : max;
                total += row.y;
            });
            average  = total/cnt;
        }else{
            min = max = total = average = "N/A"
        }
        minStr += min.toString() + " "
        maxStr += max.toString() + " "
        totalStr += total.toString() + " "
        averageStr += average.toString() + " "
    });

    // display theses statistics in the html
    $(".finalStats .min").html("Min: " + minStr);
    $(".finalStats .max").html("max: " + maxStr);
    $(".finalStats .total").html("total: " + totalStr);
    $(".finalStats .average").html("average: " + averageStr);

}

function processData(output){

    var curId      = 0;
    var curCnt     = 0;
    var splitArray = new Array();

    /*get the num of nodes*/

    $.each( output, function( key, row ) {
        splitArray = row.split(/\s+/);
        if(numOfNodes < parseInt(splitArray[POS_NODE_ID]) ){
            numOfNodes = parseInt(splitArray[POS_NODE_ID]);
        }
    });

    if(numOfNodes<1) return;
     // console.log("Number of Nodes = " + numOfNodes);
     // print one line
       // console.log(splitArray);

    for (var i = numOfNodes; i >= 0; i--) {
        nodeArray[i]      = [];
        nodeCountArray[i] = 0;
    }
    //console.log("HERE 2 " + getDateTime());
    /*split the array node-id wise*/
    var TIMESTAMP_FINAL = 0;
    $.each( output, function( key, row ) {

      // splitArray = row.split(/\s+|:/);
      splitArray               = row.split(/\s+/);
      curId                    = parseInt(splitArray[POS_NODE_ID]);
      curCnt                   = nodeCountArray[curId];
      nodeArray[curId][curCnt] = row ;
      nodeCountArray[curId]    = nodeCountArray[curId]+1;
      var timestamp            = parseInt(splitArray[POS_TIME]) + TIMESTAMP_INIT ;
      TIMESTAMP_FINAL          = timestamp > TIMESTAMP_FINAL ? timestamp : TIMESTAMP_FINAL; // obtain the final timestamp for the data obtained. This is used later in calculation of network life time and throughput.
    });
    // console.log("final timestamp" + TIMESTAMP_FINAL);
    //console.log("HERE 3 " + getDateTime());
    if(first){
        constructFilter();
    }
    /*end of if (first)*/

    var
        xyRxNodeData         = [],
        xyTxNodeData         = [],
        xyPdrNodeData        = [],
        xyTxEnergyNodeData   = [],
        xyLifetimeNodeData   = [],
        xyCcaNodeData        = [],
        xyAvgPathLossData    = [],
        xyLostNodeData       = [],
        xyDuplicateNodeData  = [],
        xyInstantPowerData   = [],
        xyThroughputNodeData = [],
        xyTxEnergyPktData    = [],
        xyAvgPowerData       = [];

    var cnt = 0;
    // MAIN LOOP
    $.each(nodeCountArray,function(id, count){
        if($.inArray(id,filteredNodes) != -1){
             // console.log("NODE " +id);
             // console.log(nodeArray[id]);
            var lastPowerlevel = 0;
            var yData          = [];
            var xyData         = [];
            var tmpAvgPower    = 0;
            var tmpAvgEnergy   = 0;
            var totalCca       = 0;
            var timestamp      = 0;
            xyEtxData          = [],
            xyEwmaEtxData      = [],
            xyRssiData         = [],
            xyRxTimeData       = [],
            xyTxEnergyTimeData = [],
            xyCcaTimeData      = [],
            xyNodeTsnData      = [],
            xyRateData         = [];
            xyPowerData        = [];

            xyRxTimeData[0] = {
                                x : 0,
                                y : 0
            };
            xyNodeTsnData[0] = {
                                x : 0,
                                y : 0
            };
            xyTxEnergyTimeData[0] = {
                                x : 0,
                                y : 0
            };
            var unq          = [];
            var lastTxEnergy = 0;
            // process per one node
            $.each(nodeArray[id],function(key,row){

                //splitArray = row.split(/\s+|:/);
                splitArray     = row.split(/\s+/);
                timestamp      = (parseInt(splitArray[POS_TIME]) + TIMESTAMP_INIT) * MSEC_FACTOR ;
                lastPowerlevel = parseInt(splitArray[POS_POWER_LEVEL]);

                // obtaining unique items in the list
                var unqFlag = 0;
                var myVal   = parseInt(splitArray[POS_SEQ_ID]);
                if($.inArray(myVal,unq) == -1){
                    unq.push(myVal);
                    unqFlag = 1;
                }
                xyPowerData[key] = {
                                    x: timestamp,
                                    y: parseInt(splitArray[POS_POWER_LEVEL]),

                };
                tmpAvgPower += parseFloat(splitArray[POS_POWER_LEVEL]);

                xyRateData[key] = {
                                    x: timestamp,
                                    y: parseInt(splitArray[POS_MODULATION]),

                };

                xyEtxData[key]   = {
                                    x: timestamp,
                                    y: parseInt(splitArray[POS_ETX])/ETX_FACTOR
                };
                xyEwmaEtxData[key]    = {
                                    x: timestamp,
                                    y: parseFloat(splitArray[POS_EWMA_ETX])/ETX_FACTOR
                };
                var rssi = parseFloat(splitArray[POS_RSSI]);
                xyRssiData[key]    = {
                                    x: timestamp,
                                    y: (rssi == 127 || rssi == 0) ? null : rssi
                };
                xyRxTimeData[key] = {
                                    x: timestamp,
                                    y: (key==0)?1 : xyRxTimeData[key-1].y + 1
                };
                
                xyNodeTsnData[key] = {
                                    x: parseInt(splitArray[POS_TSN],16),
                                    y: id,
                                    markerType: "square"
                };

                xyTxEnergyTimeData[key] = {
                                    x: timestamp,
                                    y: (unqFlag==1)? parseInt(splitArray[POS_TOTAL_TX_ENERGY])- lastTxEnergy : xyTxEnergyTimeData[key-1].y
                };

                // lastTxEnergy = parseInt(splitArray[POS_TOTAL_TX_ENERGY]);originally
                tmpAvgEnergy += parseInt(splitArray[POS_TOTAL_TX_ENERGY])- lastTxEnergy;
                lastTxEnergy = parseInt(splitArray[POS_TOTAL_TX_ENERGY]);

                totalCca += parseInt(splitArray[POS_CCA]);
                xyCcaTimeData[key] = {
                                    x: timestamp,
                                    y: parseInt(splitArray[POS_CCA])
                };

            });
            // end of process per one node. 
            // timestamp used in canvasJS is in msec but our TIMESTAMP_FINAL and TIMESTAMP_INIT are in seconds
            // TIMESTAMP_FINAL = (timestamp > TIMESTAMP_FINAL*MSEC_FACTOR) ? timestamp/MSEC_FACTOR : TIMESTAMP_FINAL;

            var len               = nodeArray[id].length
            tmpAvgPower           = Math.floor(tmpAvgPower/len);
            xyAvgPowerData[cnt] = {
                                    x          : cnt+1,
                                    y          : tmpAvgPower,
                                    name       : "NODE " + id,
                                    label      : "Node " + id ,
                                    indexLabel : "lvl {y}" + "["+ getDbmFromLvl(parseInt(tmpAvgPower)) +"dBm]"
                                };

            // tmpAvgEnergy          = parseFloat( (tmpAvgEnergy/(parseInt(splitArray[POS_TOTAL_SENT]))).toFixed(3)); // to get avg energy per tx packt
            tmpAvgEnergy = parseFloat((tmpAvgEnergy/ (unq.length-1)).toFixed(3)) // gives average energy per unique packet received. -1 because the first packet does not have energy consumption info, so we avoid that packet
            
            xyTxEnergyPktData[cnt] = {
                                    x          : cnt+1,
                                    y          : tmpAvgEnergy,
                                    name       : "NODE " + id,
                                    label      : "Node " + id ,
                                    indexLabel : "{y} mJ/pkt"
                };
            xyInstantPowerData[cnt] = {
                                    x          : cnt+1,
                                    y          :lastPowerlevel,
                                    //name     : "NODE " + id,
                                    label      : "Node " + id ,
                                    indexLabel : "{y}"
             };
             // unique received packets
            xyRxNodeData[cnt] = {
                                    x          : cnt+1,
                                    y          : unq.length,
                                    label      : "Node " + id ,
                                    indexLabel : "{y}"
             };

             // count is total number of packets received i.e unq packets + duplicates
             var duplicates = count - unq.length;
             var total_tx   = parseInt(splitArray[POS_TOTAL_SENT]) + 1;
             total_tx       += duplicates;
             var lost       = total_tx - count;

             xyTxNodeData[cnt] = {
                                    x          : cnt+1,
                                    y          : total_tx,
                                    label      : "Node " + id ,
                                    indexLabel : "{y}"
             };
             xyPdrNodeData[cnt] = {
                                    x          : cnt+1,
                                    y          : parseFloat( (xyRxNodeData[cnt].y/xyTxNodeData[cnt].y).toFixed(3)),
                                    label      : "Node " + id ,
                                    indexLabel : "{y}"
             };

             var currEnergy = parseInt(splitArray[POS_TOTAL_TX_ENERGY])
             xyTxEnergyNodeData[cnt] = {
                                    x          : cnt+1,
                                    y          : currEnergy,
                                    label      : "Node " + id ,
                                    indexLabel : "{y}"
             };

             var energyRem = ENERGY_INIT - currEnergy;
             var dur       = TIMESTAMP_FINAL - TIMESTAMP_INIT;
             var drainRate = currEnergy / dur;
             var lifetime  = Math.floor(energyRem / drainRate);
             
            xyLifetimeNodeData[cnt] = {
                                    x          : cnt+1,
                                    y          : lifetime,
                                    label      : "Node " + id ,
                                    indexLabel : "{y}"
            };
            throughput = (parseFloat((unq.length - 1 ) * DATA_SIZE *8 )/ parseFloat(dur))
            xyThroughputNodeData[cnt] = {
                                    x          : cnt+1,
                                    y          : throughput,
                                    label      : "Node " + id ,
                                    indexLabel : "{y}"
            };
           
            xyCcaNodeData[cnt] = {
                                    x          : cnt+1,
                                    y          : totalCca,
                                    label      : "Node " + id ,
                                    indexLabel : "{y}"
             };
            xyAvgPathLossData[cnt] = {
                                    x          : cnt+1,
                                    y          : parseInt(splitArray[POS_AVG_PATH_LOSS]),
                                    label      : "Node " + id ,
                                    indexLabel : "{y}"
             };
             xyLostNodeData[cnt] = {
                                    x          : cnt+1,
                                    y          : lost,
                                    label      : "Node " + id ,
                                    indexLabel : "{y}"
             };
            xyDuplicateNodeData[cnt] = {
                                    x          : cnt+1,
                                    y          : duplicates,
                                    label      : "Node " + id ,
                                    indexLabel : "{y}"
             };

            powerObj = {
                        showInLegend   : true,
                        legendText     : "NODE " + id,
                        name           : "NODE "+id,
                        type           : chartTypes["powerLevel"],
                        toolTipContent : "<span style='\"'color: {color};'\"'>{name}</span>: {y}",
                        xValueType     : "dateTime",
                        dataPoints     : xyPowerData
            };
            rateObj = {
                        showInLegend   : true,
                        legendText     : "NODE " + id,
                        name           : "NODE "+id,
                        type           : chartTypes["rateLevel"],
                        toolTipContent : "<span style='\"'color: {color};'\"'>{name}</span>: {y}",
                        xValueType     : "dateTime",
                        dataPoints     : xyRateData
            };
            etxObj = {
                        showInLegend   : true,
                        //legendText   : "NODE " + id,
                        name           : "NODE "+id,
                        type           : chartTypes["etx"],
                        toolTipContent : "<span style='\"'color: {color};'\"'>{name}</span>: {y}",
                        xValueType     : "dateTime",
                        dataPoints     : xyEtxData
            };
            ewmaEtxObj = {
                            showInLegend   : true,
                            //legendText   : "NODE " + id,
                            name           : "NODE "+id,
                            type           : chartTypes["ewmaEtx"],
                            toolTipContent : "<span style='\"'color: {color};'\"'>{name}</span>: {y}",
                            xValueType     : "dateTime",
                            dataPoints     : xyEwmaEtxData
            };
            rssiObj = {
                        showInLegend   : true,
                        //legendText   : "NODE " + id,
                        connectNullData: true,
                        name           : "NODE "+id,
                        type           : chartTypes["rssi"],
                        toolTipContent : "<span style='\"'color: {color};'\"'>{name}</span>: {y}",
                        xValueType     : "dateTime",
                        dataPoints     : xyRssiData
            };
            rxTimeObj = {
                            showInLegend   : true,
                            //legendText   : "NODE " + id,
                            name           : "NODE "+id,
                            type           : chartTypes["rxTime"],
                            toolTipContent : "<span style='\"'color: {color};'\"'>{name}</span>: {y}",
                            xValueType     : "dateTime",
                            dataPoints     : xyRxTimeData
            };
            nodeTsnObj = {
                            showInLegend   : true,
                            //legendText   : "NODE " + id,
                            name           : "NODE "+id,
                            type           : chartTypes["nodeTsn"],
                            toolTipContent : "<span style='\"'color: {color};'\"'>{name}</span>: {y}",
                            // xValueType     : "dateTime",
                            dataPoints     : xyNodeTsnData
            };
            txEnergyTimeObj = {
                            showInLegend   : true,
                            //legendText   : "NODE " + id,
                            name           : "NODE "+id,
                            type           : chartTypes["txEnergyTime"],
                            toolTipContent : "<span style='\"'color: {color};'\"'>{name}</span>: {y}",
                            xValueType     : "dateTime",
                            dataPoints     : xyTxEnergyTimeData
            };

            ccaTimeObj = {
                            showInLegend   : true,
                            //legendText   : "NODE " + id,
                            name           : "NODE "+id,
                            type           : chartTypes["ccaTime"],
                            toolTipContent : "<span style='\"'color: {color};'\"'>{name}</span>: {y}",
                            xValueType     : "dateTime",
                            dataPoints     : xyCcaTimeData
            };
            powerEtxObjEtx = {
                                showInLegend   : true,
                                //legendText   : "NODE " + id,
                                name           : "E_NODE "+id,
                                axisYType      : "secondary",
                                lineDashType   : "dash",
                                type           : chartTypes["etx"],
                                toolTipContent : "<span style='\"'color: {color};'\"'>{name}</span>: {y}",
                                xValueType     : "dateTime",
                                dataPoints     : xyEtxData
            }
            powerEtxObjPower = {
                                showInLegend   : true,
                                // legendText  : "NODE " + id,
                                name           : "P_NODE "+id,
                                type           : chartTypes["powerLevel"],
                                axisYType      : "primary",
                                toolTipContent : "<span style='\"'color: {color};'\"'>{name}</span>: {y}",
                                xValueType     : "dateTime",
                                dataPoints     : xyPowerData
            };

            powerEwmaEtxObjEtx = {
                                showInLegend   : true,
                                //legendText   : "NODE " + id,
                                name           : "E_NODE "+id,
                                axisYType      : "secondary",
                                lineDashType   : "dash",
                                type           : chartTypes["ewmaEtx"],
                                toolTipContent : "<span style='\"'color: {color};'\"'>{name}</span>: {y}",
                                xValueType     : "dateTime",
                                dataPoints     : xyEwmaEtxData
            }
            powerEwmaEtxObjPower = {
                                showInLegend   : true,
                                // legendText  : "NODE " + id,
                                name           : "P_NODE "+id,
                                type           : chartTypes["powerLevel"],
                                axisYType      : "primary",
                                toolTipContent : "<span style='\"'color: {color};'\"'>{name}</span>: {y}",
                                xValueType     : "dateTime",
                                dataPoints     : xyPowerData
            };


            datasets["powerLevel"].push(powerObj);
            datasets["rateLevel"].push(rateObj);
            datasets["etx"].push(etxObj);
            datasets["ewmaEtx"].push(ewmaEtxObj);
            datasets["rxTime"].push(rxTimeObj);
            datasets["nodeTsn"].push(nodeTsnObj);
            datasets["txEnergyTime"].push(txEnergyTimeObj);
            datasets["ccaTime"].push(ccaTimeObj);
            datasets["rssi"].push(rssiObj);
            datasets["powerEtx"].push(powerEtxObjPower);
            datasets["powerEtx"].push(powerEtxObjEtx);
            datasets["powerEwmaEtx"].push(powerEwmaEtxObjPower);
            datasets["powerEwmaEtx"].push(powerEwmaEtxObjEtx);

            cnt = cnt+1;
        }
        // end of if($.inArray(id,filteredNodes) != -1){
        numOfNodesAfterFilter = cnt;

    });
    // end of Main Loop

    // update the last timestamp obtained
    var intv = TIMESTAMP_FINAL - TIMESTAMP_INIT
    $("#rxDuration").html("RX Duration: " + intv + "sec [ " + msToTime1(intv*MSEC_FACTOR) + " ]");

    //console.log("HERE 5 " + getDateTime());
    avgPowerObj = {
                    // showInLegend   : true,
                    legendText     : "AveragePower",
                    //name           : "NODE " + id,
                    type             : chartTypes["averagePower"],
                    // toolTipContent : "<span style='\"'color: {color};'\"'>{name}</span>: {y}",

                    dataPoints       : xyAvgPowerData
    };
     txEnergyPktObj = {
                    legendText     : "Energy/pkt",                    
                    type             : chartTypes["txEnergyPktNode"],
                    dataPoints       : xyTxEnergyPktData
    };
    rxNodeObj = {
                    type       : chartTypes["rxNode"],
                    dataPoints : xyRxNodeData
    };
    txNodeObj = {
                    type       : chartTypes["txNode"],
                    dataPoints : xyTxNodeData
    };

    txNodeTmpObj = {
                    type         : "stackedColumn",
                    showInLegend : "true",
                    legendText   : "Total Sent ",
                    axisYType    : "primary",
                    dataPoints   : xyTxNodeData
    };
    rxNodeTmpObj = {
                    type         : "stackedColumn",
                    showInLegend : "true",
                    legendText   : "Total Unique Received ",
                    axisYType    : "primary",
                    dataPoints   : xyRxNodeData
    };

    pdrNodeObj = {
                    type         : chartTypes["powerLevel"],
                    showInLegend : "true",
                    legendText   : "PDR",
                    lineDashType : "dash",
                    axisYType    : "secondary",
                    dataPoints   : xyPdrNodeData
    };


    txEnergyNodeObj = {
                    legendText     : "totalEnergy",                    
                    type       : chartTypes["txEnergyNode"],
                    dataPoints : xyTxEnergyNodeData
    };
    lifetimeNodeObj = {
                    legendText     : "Lifetime",                    
                    type       : chartTypes["lifetimeNode"],
                    dataPoints : xyLifetimeNodeData
    };
    throughputNodeObj = {
                    legendText     : "Throughput",                    
                    type       : chartTypes["throughputNode"],
                    dataPoints : xyThroughputNodeData
    };
    ccaNodeObj = {
                    legendText     : "CCA",                    
                    type       : chartTypes["ccaNode"],
                    dataPoints : xyCcaNodeData
    };
    avgPathLossObj = {
                    legendText     : "avgPathLoss",                    
                    type       : chartTypes["avgPathLoss"],
                    dataPoints : xyAvgPathLossData
    };
    lostNodeObj = {
                    // type         : "stackedColumn",
                    showInLegend : "true",
                    legendText   : "Lost",
                    type       : "stackedColumn",
                    dataPoints : xyLostNodeData
    };
    duplicateNodeObj = {
                    type       : "stackedColumn",
                    dataPoints : xyDuplicateNodeData,
                    showInLegend : "true",
                    legendText   : "Duplicates",
    };
    instantPowerObj = {
                    legendText     : "instantPower",                    
                    dataPoints : xyInstantPowerData
    };

    datasets["averagePower"].push(avgPowerObj);
    datasets["txEnergyPktNode"].push(txEnergyPktObj);
    // datasets["rxNode"].push(rxNodeObj);
    // datasets["txNode"].push(txNodeObj);
    datasets["txRxPdrNode"].push(txNodeTmpObj);
    datasets["txRxPdrNode"].push(rxNodeTmpObj);
    datasets["txRxPdrNode"].push(pdrNodeObj);
    datasets["txEnergyNode"].push(txEnergyNodeObj);
    datasets["lifetimeNode"].push(lifetimeNodeObj);
    datasets["throughputNode"].push(throughputNodeObj);
    datasets["ccaNode"].push(ccaNodeObj);
    datasets["avgPathLoss"].push(avgPathLossObj);
    // datasets["lostNode"].push(lostNodeObj);
    // datasets["duplicateNode"].push(duplicateNodeObj);
    datasets["lostDupsNode"].push(lostNodeObj);
    datasets["lostDupsNode"].push(duplicateNodeObj);

    datasets["instantPower"].push(instantPowerObj);
    
    first =  false;

}
// end of processData function

function updateChart(forced){


    ajaxGetData(function(output){

        // if there is no update
        if(lastLineNum == curLineNum && forced==false){
            // do nothing
        }else{ // if there are updates
            lastLineNum = curLineNum;

            // clear old data
            clearChartData();

            // process new data
            processData(output);

            // update all data set
            $.each( charts, function( key, row ) {
                charts[key].options.data = datasets[key];
            });

            // render the current chart only
            //$(".ui-tabs-active.ui-state-active").each(function(key,element){
            $(".tab-pane.fade.active.show .ui-tabs-active.ui-state-active").each(function(key,element){

                    var attr  = $(this).attr("aria-controls");
                    var tabId = attr.substr(attr.indexOf('-')+1, attr.length);
                    if(forced==true)
                        charts[tabId] = drawChart(chartTypes[tabId], tabId, datasets[tabId],true);
                    else
                        charts[tabId].render();
                    // update the data table
                    $("#myDataTable").html("");
                    if(dataTableOption[tabId])
                        insertDataTable(tabId, datasets[tabId]);
            });

        }
        // end of if there are updates
    });
    // end of ajaxGetData

    // update the timer only for periodic updates forced = false
    if(!forced)
        $('#lastUpdateTime').html("Last Update : "+getDateTime());
}
// end of function

function clearChartData(){
    // rxNodeChart.options.data[0].dataPoints = [] ;
    $.each( charts, function( key, row ) {
        charts[key].options.data = {};
        datasets[key] = [];
    });
}

function ajaxGetData(handleData){
    var logFileName  = LOG_FILE_NAME;
    var filterString = "TPC:RV:";
    var filterString2 = "TPC:LQL";

    jQuery.ajax({
            type     : "post",
            url      : logFileName,
            dataType : "text",
            isLocal  : true,
            mimeType: 'text/plain; charset=x-user-defined',
            // ContentType: "text/plain",
           contentType : "text/plain",
            dataFilter: function(data, type) {
                var lArray = new Array();
                var lArray2 = new Array();
                var lines  = data.split('\n');
                var splitArray = [];
                // console.log("FULL " );
                // console.log(lines);

                lArray = jQuery.grep(lines, function( row, index ) {
                    return ( row.indexOf(filterString) >=0);
                });

                lArray2 = jQuery.grep(lines, function( row, index ) {
                    return ( row.indexOf(filterString2) >=0);
                });
                
                // obtain the TPC type, rate and TX TSN
                // console.log(lArray2);
                splitArray = lArray2[0].split(" ");
                // console.log(splitArray);
                TSN_TX     = splitArray[1].split(",");
                TPC        = parseInt(splitArray[3]);
                version    = parseInt(splitArray[7]);
                version    = version % 10;
                if (TPC < 10){
                        rate = "@RATE_"+TPC+" [0x"+(81+TPC)+"]";
                        TPC = "MAXPWR";
                }
                else if (TPC < 20){
                        rate = "@RATE_"+(TPC-10)+" [0x"+(81+TPC-10)+"]";
                        TPC = "TPC";
                }   
                else{
                        rate = " ";
                        TPC = "TPRC";
                }
                $("#tpcValue").html("["+version+"/7] "+TPC + " { " + TSN_TX + " } " + rate);

                TOTAL_RX_CNT=lArray.length                
                $("#totalRx").html("/"+TOTAL_RX_CNT);
                if (RX_LIMIT >0){
                    limitData = lArray.slice(0,RX_LIMIT);
                }
                else{
                    limitData=lArray
                }
                $(document).attr("title", TPC +" ["+ version + "/7] lt:"+RX_LIMIT);

                return (limitData);
            },
            success : function (data) {
                curLineNum = data.length;

                handleData(data)

            },
            error : function(ret){
                alert("data cannot be retrieved from " +logFileName );
            }

        });
        // end of jqery.ajax

}

function drawChart(chartType, id, chartData, renderFlag) {
    var chart;
    switch (chartType){
        case "line":
        case "spline":
        case "splineArea":
        case "scatter":
            chart = drawLineChart(id,chartData);
            break;
        case "column":
        case "stackedColumn":
            chart = drawColumnChart(id,chartData);
            break;
        case "multiLine":
            chart = drawMultiLineChart(id,chartData);
            break;
        default:
            alert("Improper chart type "+chartType+" for " + id);
    }

    if(renderFlag)
        chart.render();
    return chart;

}

function drawMultiLineChart(id, chartData){

     var myColorSet = [];
    // if same color combination required, replace numOfNodesAfterFilter to numOfNodes-1
    for (var i = numOfNodesAfterFilter*2; i > 0; i--) {
        myColorSet[i-1] = getRGBa(numOfNodesAfterFilter*2,i,1);
    }

    CanvasJS.addColorSet("uniqueColorSet",myColorSet);
    var chart = new CanvasJS.Chart(id,
    {
        animationEnabled : true,
        // animationDuration: 10000,
        
        colorSet         : "uniqueColorSet",
        exportEnabled    : true,
        animationRender  : true,
        zoomEnabled      : true,
        //zoomType       : "xy",

        title:{
              text: chartOptions[id].chartTitle
        },
        axisX:{
            title : chartOptions[id].xAxisTitle,
            // valueFormatString: "YYYY/MM/DD HH:mm:ss" ,
            // valueFormatString: "HH:mm:ss" ,
            labelAngle: -45,
            crosshair: {
                enabled         : true,
                snapToDataPoint : true
            }
        },

        axisY2: [
                {
                interval: 1,
                maximum : chartOptions[id].yAxis2Max,
                title: chartOptions[id].yAxisTitle2,
                stripLines:[
                            {
                                value:chartOptions[id].thValue,
                                label:chartOptions[id].thTitle+" "+chartOptions[id].thValue
                            }
                            ],
                // lineColor: "#369EAD",
                },


        ],
        axisY:{
            title : chartOptions[id].yAxisTitle,
            crosshair: {
                enabled         : false,
                snapToDataPoint : true,
                /*labelFormatter: function(e) {
                    return "$" + CanvasJS.formatNumber(e.value, "##0.00");
                }*/
            }
        },

        legend: {
            horizontalAlign : "left", // left, center ,right
            verticalAlign   : "center",  // top, center, bottom
            cursor          : "pointer",
            itemclick: function (e) {
                //console.log("legend click: " + e.dataPointIndex);
                //console.log(e);
                if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                    e.dataSeries.visible = false;
                } else {
                    e.dataSeries.visible = true;
                }

                e.chart.render();
            }
        },
      data: chartData
    });

    // chart.render();
    return chart;
}

function drawLineChart(id, chartData){
     var myColorSet = [];
    // if same color combination required, replace numOfNodesAfterFilter to numOfNodes-1
    for (var i = numOfNodesAfterFilter; i > 0; i--) {
        myColorSet[i-1] = getRGBa(numOfNodesAfterFilter,i,1);
    }

    CanvasJS.addColorSet("uniqueColorSet",myColorSet);
    var chart = new CanvasJS.Chart(id,
    {
        animationEnabled : true,
        colorSet         : "uniqueColorSet",
        // animationDuration: 10000,
        exportEnabled    : true,
        animationRender  : true,
        zoomEnabled      : true,
        //zoomType       : "xy",
        title:{
              text: chartOptions[id].chartTitle
        },
        axisX:{
            title : chartOptions[id].xAxisTitle,
            // valueFormatString: "YYYY/MM/DD HH:mm:ss" ,
            labelAngle: -45,
            crosshair: {
                enabled         : true,
                snapToDataPoint : true
            }
        },
        /*axisX2:{
         title : "Secondary X Axis"
        },*/

        axisY:{
            title : chartOptions[id].yAxisTitle,
            stripLines:[
            {
                value:chartOptions[id].thValue,
                label:chartOptions[id].thTitle+" "+chartOptions[id].thValue
            }
            ],
            // maximum:,
            crosshair: {
                enabled         : false,
                snapToDataPoint : true,
                /*labelFormatter: function(e) {
                    return "$" + CanvasJS.formatNumber(e.value, "##0.00");
                }*/
            }
        },
       /* axisY2:{
            title : "Secondary Y Axis"
        },*/
        legend: {
            horizontalAlign : "left", // left, center ,right
            verticalAlign   : "center",  // top, center, bottom
            cursor          : "pointer",
            itemclick: function (e) {
                //console.log("legend click: " + e.dataPointIndex);
                //console.log(e);
                if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                    e.dataSeries.visible = false;
                } else {
                    e.dataSeries.visible = true;
                }

                e.chart.render();
            }
        },
      data: chartData
    });

    // chart.render();
    return chart;
}

function drawColumnChart(id, chartData){
    var myColorSet = [];
    //numOfNodes = 23;
    // if same color combination required, replace numOfNodesAfterFilter to numOfNodes-1
    for (var i = numOfNodesAfterFilter; i > 0; i--) {
        myColorSet[i-1] = getRGBa(numOfNodesAfterFilter,i,1);
    }
    /*console.log("color set ")
    console.log(myColorSet);*/
    CanvasJS.addColorSet("uniqueColorSet",myColorSet);
    // console.log(numOfNodesAfterFilter);

    /*chartData = [

      {
        dataPoints: [
        { x: 1, y: 297571, label: "Venezuela"},
        { x: 2, y: 267017,  label: "Saudi" },
        { x: 3, y: 175200,  label: "Canada"},
        { x: 4, y: 154580,  label: "Iran"},
        { x: 5, y: 116000,  label: "Russia"},
        { x: 6, y: 97800, label: "UAE"},
        { x: 7, y: 20682,  label: "US"},
        { x: 8, y: 20350,  label: "China"},
        { x: 9, y: 2050,  label: "China"},
        { x: 10, y: 30350,  label: "China"},
        { x: 11, y: 40350,  label: "China"},
        { x: 12, y: 2050,  label: "China"},
        { x: 13, y: 30350,  label: "China"},
        { x: 14, y: 40350,  label: "China"},
        { x: 15, y: 2050,  label: "China"},
        { x: 16, y: 30350,  label: "China"},
        { x: 17, y: 40350,  label: "China"},
        { x: 18, y: 2050,  label: "China"},
        { x: 19, y: 30350,  label: "China"},
        { x: 20, y: 40350,  label: "China"},
        { x: 21, y: 2050,  label: "China"},
        { x: 22, y: 30350,  label: "China"},
        { x: 23, y: 40350,  label: "China"}
        ]
      }
      ]*/

    var chart = new CanvasJS.Chart(id,
    {
        colorSet         : "uniqueColorSet",
        exportEnabled    : true,

        animationEnabled : true,
        zoomEnabled      : true,

        title:{
              text: chartOptions[id].chartTitle
        },
        axisX:{
            title : chartOptions[id].xAxisTitle,
            //valueFormatString: "HH:mm:ss" ,
            //labelAngle: -45
        },
        /*axisX2:{
         title : "Secondary X Axis"
        },*/

        axisY:{
            title : chartOptions[id].yAxisTitle
        },
       /* axisY2:{
            title : "Secondary Y Axis"
        },*/
        legend: {
            horizontalAlign : "left", // left, center ,right
            verticalAlign   : "center",  // top, center, bottom
            cursor          : "pointer",
            itemclick: function (e) {
                //console.log("legend click: " + e.dataPointIndex);
                //console.log(e);
                if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                    e.dataSeries.visible = false;
                } else {
                    e.dataSeries.visible = true;
                }

                e.chart.render();
            }
        },
      data: chartData
    });

    // chart.render();
    return chart;
}

/*controls*/
$(document).ready(function(){

    $('#logFileSelect').change(function(){
        var filename = $('#logFileSelect').val().split('\\').pop();
        LOG_FILE_NAME=filename;
        location.reload();
    });

    $('#btnNow').click(function(){
        setDateTimeNow("");
        updateChart(true);
    });
    $('#btnSet').click(function(){
        setInitTimeStamp();
        updateChart(true);
    });

    $("#btnSetLimit").click(function(){
        var myTabId=0;
        setRxLimit(); 
        updateChart(true);
       
    });
    $(document).ajaxStart(function () {
        $('#loading').show();  // show loading indicator
    });

    $(document).ajaxStop(function()
    {
        $('#loading').hide();  // hide loading indicator

    });
    $(".hideAll").click(function(){
        alert("clicked");
    });

    // start collect
    $("#btnStart").click(function(){
        var intv     = $("#updateInterval").val();
        console.log("start collecting with " + intv + "sec interval");
        startCollect = true;
        refreshTabs();

        startDate    = new Date(TIMESTAMP_INIT*1000);
        $("#startCollectTime").html("Start Time: " + startDate);
        $("#stopCollectTime").html("Stop Time: ");
        $("#collectionDurationTime").html("Collection Duration: " );
        $("#lastUpdateTime").html("Last Update: ");

        // $( ".tab-pane.fade.active.show .myTabs" ).tabs( "option", "active", 1 );
        // $( ".tab-pane.fade.active.show .myTabs" ).tabs( "option", "active", 0 );
    });

    // stop collect
    $("#btnStop").click(function(){
        if(!startCollect){
            alert("not started yet");
        }
        console.log("stop collecting");
        // stop the current timer if any
        if (intervalId!=0)
            clearInterval(intervalId);
        startCollect = false;
        var stopDate = getDateTime();
        var intv     = stopDate - startDate;

        intv         = msToTime1(intv);

        $("#stopCollectTime").html("Stop Time: " + stopDate);
        $("#collectionDurationTime").html("Collection Duration: " + intv);

    });

    // update interval
    $("#updateInterval").change(function(){
        console.log ("Interval changed to  " + $(this).val());
        if(startCollect){
            refreshTabs();
        }
    });

    // update Inteval type
    $("#updateIntervalType").change(function(){
        console.log ("Interval changed to  " + $(this).val());
        if(startCollect){
            refreshTabs();
        }
    });



    // filter list show
    $(".dropdown dt a #filterNodes").on('click', function() {
      $(".dropdown dd ul").slideToggle('fast');
    });
    // filter list hide
    $(".dropdown dd ul li a #filterNodes").on('click', function() {
      $(".dropdown dd ul").hide();
    });

    // select all and unselect functionality
    $('.dropdown #multiSelect input[type="checkbox"]').ready(function(){

        $('#selectAll').on('click',function(){
            $('.dropdown #multiSelect input[type="checkbox"]').prop("checked",true);
            // console.log("select");
            filteredNodes = NodesBackup;
            updateChart(true);
        })

        $('#unSelectAll').on('click',function(){
            $('.dropdown #multiSelect input[type="checkbox"]').prop("checked",false);
            // console.log("unselect");
            filteredNodes = [];
            clearChartData();
            // clear the current chart
            $(".tab-pane.fade.active.show .ui-tabs-active.ui-state-active").each(function(key,element){

                    var attr  = $(this).attr("aria-controls");
                    var tabId = attr.substr(attr.indexOf('-')+1, attr.length);
                    charts[tabId].render();
            });
        })

    });
    /*end of checkbox.ready function*/

});

function refreshTabs(){
    var myTab = $(".tab-pane.fade.active.show .ui-tabs-active.ui-state-active a");
    $(".tab-pane.fade.active.show .myTabs li[aria-selected='false'] a ").first().trigger("click");
    myTab.trigger("click");
}
/*window.onload = function () {
       var myColorSet = [];
    //numOfNodes = 23;
    // if same color combination required, replace numOfNodesAfterFilter to numOfNodes-1
    for (var i = 3; i > 0; i--) {
        myColorSet[i-1] = getRGBa(3,i,1);
    }
    CanvasJS.addColorSet("uniqueColorSet",myColorSet);

var chart = new CanvasJS.Chart("chartContainer",{
    colorSet         : "uniqueColorSet",
    title:{
        text: "Rendering chart against Multiple Y axis"
    },

    axisY2:
        {
            title: "Axis Y 2 Title",
            // lineColor: "#369EAD",
        },


    axisY:

        {
            title: "Axis Y 1 Title",
            // lineColor: "#C24642",
        }
    ,

    data: [
        {
        type: "line",
        axisYType: "primary",
        // axisYIndex: 0,
        dataPoints: [
            { x: 10, y: 6, label:"Apple" },
            { x: 20, y: 2, label:"Mango" },
            { x: 30, y: 5, label:"Orange" },
            { x: 40, y: 7, label:"Banana" },
            { x: 50, y: 1, label:"Pineapple" },
            { x: 60, y: 5, label:"Pears" },
            { x: 70, y: 5, label:"Grapes" },
            { x: 80, y: 2, label:"Lychee" },
            { x: 90, y: 2, label:"Jackfruit" }
        ]
        },
        {
        type: "line",
        axisYType: "primary",
        // axisYIndex: 0,
        dataPoints: [
            { x: 10, y: 9, label:"Apple" },
            { x: 20, y: 5, label:"Mango" },
            { x: 30, y: 4, label:"Orange" },
            { x: 40, y: 3, label:"Banana" },
            { x: 50, y: 7, label:"Pineapple" },
            { x: 60, y: 1, label:"Pears" },
            { x: 70, y: 3, label:"Grapes" },
            { x: 80, y: 4, label:"Lychee" },
            { x: 90, y: 8, label:"Jackfruit" }
        ]
        },
        {
        type: "line",
        axisYType: "secondary",
        // axisYIndex: 1,
        dataPoints: [
            { x: 10, y: 100, label:"Apple" },
            { x: 20, y: 70, label:"Mango" },
            { x: 30, y: 102, label:"Orange" },
            { x: 40, y: 80, label:"Banana" },
            { x: 50, y: 48, label:"Pineapple" },
            { x: 60, y: 95, label:"Pears" },
            { x: 70, y: 102, label:"Grapes" },
            { x: 80, y: 98, label:"Lychee" },
            { x: 90, y: 156, label:"Jackfruit" }
        ]
        },
    ]
});
// console.log(chart.options);
chart.render();
}*/

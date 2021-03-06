const CHART_VERSION = 2.7
const TEST_HW = 1;

var LOG_FILE_NAME = "LOG_TPC.log";
// positions in the log file
var     POS_TIME,
        POS_TSN,
        POS_NODE_ID,
        POS_SEQ_ID,
        POS_POWER_L,
        POS_ETX,
        POS_EWMA_ET,
        POS_TOTAL_SENT,
        POS_TOTAL_TX_ENERGY,
        POS_CCA,
        POS_PATH_LOSS,
        POS_AVG_PATH_LOSS,
        POS_MODULATION,
        POS_RSSI;

/*for simulation*/
if (TEST_HW == 0){
    POS_TIME            = 4;
    POS_NODE_ID         = 5;
    POS_SEQ_ID          = 6;
    POS_POWER_LEVEL     = 7;
    POS_ETX             = 8;
    POS_EWMA_ETX        = 9;
    POS_TOTAL_SENT      = 10;
    POS_TOTAL_TX_ENERGY = 11;
    POS_CCA             = 12;
    POS_PATH_LOSS       = 14;
    POS_AVG_PATH_LOSS   = 15;
    POS_RSSI            = 17;
}else{/*for hw*/
    POS_TIME            = 3;
    POS_TSN             = 4;
    POS_NODE_ID         = 5;
    POS_SEQ_ID          = 6;
    POS_POWER_LEVEL     = 7;
    POS_ETX             = 8;
    POS_EWMA_ETX        = 9;
    POS_TOTAL_SENT      = 10;
    POS_TOTAL_TX_ENERGY = 11;
    POS_CCA             = 12;
    POS_MODULATION      = 13;
    POS_PATH_LOSS       = 14;
    POS_AVG_PATH_LOSS   = 15;
    POS_RSSI            = 17;
}

var MSEC_FACTOR = 1000;
if (TEST_HW) {
    MSEC_FACTOR = 1000;
}

const ETX_FACTOR = 128;
var TIMESTAMP_INIT = 0;
const MIN_TX_POWER_DB = -13;

/*data rate and transmission time*/
var DATA_RATE,DATA_SIZE, TIME_PER_PKT;
if(TEST_HW){
    DATA_SIZE    = 64; // bytes
    DATA_RATE    = 12.5; //kbps
    TIME_PER_PKT = DATA_SIZE*8 / (DATA_RATE*1000); //IN SECONDS
}else{
    DATA_SIZE    = 64; // bytes
    DATA_RATE    = 250; //kbps
    TIME_PER_PKT = DATA_SIZE*8 / (DATA_RATE*1000); //IN SECONDS
}


// types of charts
charts = {
    "powerLevel"      : {},
    "rateLevel"       : {},
    "rssi"            : {},
    "etx"             : {},
    "ewmaEtx"         : {},
    "lostNode"        : {},
    "duplicateNode"   : {},
    // "rxNode"       : {},
    "rxTime"          : {},
    "nodeTsn"          : {},
    // "txNode"       : {},
    "txEnergyNode"    : {},
    "txEnergyPktNode" : {},
    "txEnergyTime"    : {},
    "ccaNode"         : {},
    "ccaTime"         : {},
    // "pathLoss"     : {},
    "avgPathLoss"     : {},
    "averagePower"    : {},
    "instantPower"    : {},
    "txRxPdrNode"     : {},
    "powerEtx"        : {},
    "powerEwmaEtx"    : {}
};

// chart types
chartTypes = {
        "powerLevel"      : "line",
        "rateLevel"      : "line",
        "rssi"            : "line",
        "etx"             : "line",
        "ewmaEtx"         : "spline",
        // "rxNode"       : "column",
        // "txNode"       : "column",
        "txEnergyNode"    : "column",
        "txEnergyPktNode" : "column",
        "txEnergyTime"    : "line",
        "ccaNode"         : "column",
        "lostNode"        : "column",
        "duplicateNode"   : "column",
        "rxTime"          : "scatter",
        "nodeTsn"          : "scatter",
        "ccaTime"         : "scatter",
        // "pathLoss"     : "column",
        "avgPathLoss"     : "column",
        "averagePower"    : "column",
        "instantPower"    : "column",
        "powerEtx"        : "multiLine",
        "txRxPdrNode"     : "multiLine",
        "powerEwmaEtx"    : "multiLine"
};

// chart types
dataTableOption = {
        "powerLevel"      : false,
        "rateLevel"       : false,
        "rssi"            : false,
        "etx"             : false,
        "ewmaEtx"         : false,
        // "rxNode"       : ,
        // "txNode"       : ,
        "txEnergyNode"    : true,
        "txEnergyPktNode" : true,
        "txEnergyTime"    : false,
        "ccaNode"         : true,
        "lostNode"        : true,
        "duplicateNode"   : true,
        "rxTime"          : false,
        "nodeTsn"          : false,
        "ccaTime"         : false,
        // "pathLoss"     : ,
        "avgPathLoss"     : true,
        "averagePower"    : true,
        "instantPower"    : true,
        "powerEtx"        : false,
        "txRxPdrNode"     : true,
        "powerEwmaEtx"    : false
};


// datasets for different charts
datasets = {
    "powerLevel"      : [],
    "rateLevel"       : [],
    "rssi"            : [],
    "etx"             : [],
    "ewmaEtx"         : [],
    // "rxNode"       : [],
    // "txNode"       : [],
    "txEnergyNode"    : [],
    "txEnergyPktNode" : [],
    "txEnergyTime"    : [],
    "ccaNode"         : [],
    "lostNode"        : [],
    "duplicateNode"   : [],
    "rxTime"          : [],
    "nodeTsn"          : [],
    "ccaTime"         : [],
    "avgPathLoss"     : [],
    "averagePower"    : [],
    "instantPower"    : [],
    "powerEtx"        : [],
    "txRxPdrNode"     : [],
    "powerEwmaEtx"    : []
}

// chart options for different charts
chartOptions = {
    "powerLevel"   : {
                        "chartTitle" : "Power level History",
                        "xAxisTitle" : "Time",
                        "yAxisTitle" : "Power Level",
                        "thTitle"    : "Max Power",
                        "thValue"    : "13"

                    },
    "rateLevel"   : {
                        "chartTitle" : "Rate level History",
                        "xAxisTitle" : "Time",
                        "yAxisTitle" : "Rate Level",

                        "thTitle"    : "Max Rate",
                        "thValue"    : "3"

                    },
    "rssi"         : {
                        "chartTitle" : "Received Signal Strength (dBm)",
                        "xAxisTitle" : "Time",
                        "yAxisTitle" : "RSSI (dBm)",
                        "thTitle"    : "Rx sen",
                        "thValue"    : "-110",


                    },
    "etx"          : {
                        "chartTitle" : "Expected Transmission Count (ETX)",
                        "xAxisTitle" : "Time",
                        "yAxisTitle" : "ETX",
                        "thTitle"    : "ETX Threshold",
                        "thValue"    : "1.5"
                    },
    "ewmaEtx"      : {
                        "chartTitle" : "Exponential Weighted Mean Average ETX",
                        "xAxisTitle" : "Time",
                        "yAxisTitle" : "EWMA ETX",
                        "thTitle"    : "EWMA_ETX Threshold",
                        "thValue"    : "1.5"
                    },
     /*"rxNode"       : {
                        "chartTitle" : "Number of received packets per Node",
                        "xAxisTitle" : "NODES",
                        "yAxisTitle" : "Pkts recv"
                    },
     "txNode"       : {
                        "chartTitle" : "Total Transmitted packets per Node",
                        "xAxisTitle" : "NODES",
                        "yAxisTitle" : "Pkts Sent"
                    },*/
    "txEnergyNode"       : {
                        "chartTitle" : "Total Transmitted Energy per Node (mJoules)",
                        "xAxisTitle" : "NODES",
                        "yAxisTitle" : "TX energy Consumed (mJoules)"
                    },
    "txEnergyPktNode"       : {
                        "chartTitle" : "Average Energy per pkt per Node (mJoules)",
                        "xAxisTitle" : "NODES",
                        "yAxisTitle" : "Avg. energy Consumed/pkt (mJoules)"
                    },
    "txEnergyTime"       : {
                        "chartTitle" : "Transmitted Energy with time (mJoules)",
                        "xAxisTitle" : "Time",
                        "yAxisTitle" : "TX energy Consumed (mJoules)"
                    },
    "ccaNode"       : {
                        "chartTitle" : "Number of channel busy per Node",
                        "xAxisTitle" : "NODES",
                        "yAxisTitle" : "Channel Busy Count"
                    },
    "avgPathLoss"       : {
                        "chartTitle" : "Estimated Average Path Loss",
                        "xAxisTitle" : "NODES",
                        "yAxisTitle" : "Average PathLoss (dB)"
                    },
    "lostNode"       : {
                        "chartTitle" : "Estimated number of lost packets per Node",
                        "xAxisTitle" : "NODES",
                        "yAxisTitle" : "Pkts lost"
                    },
    "duplicateNode"       : {
                        "chartTitle" : "Estimated number of duplicate packets per Node",
                        "xAxisTitle" : "NODES",
                        "yAxisTitle" : "Duplicates"
                    },

    "rxTime"       : {
                        "chartTitle" : "Number of received packets with Time",
                        "xAxisTitle" : "Time",
                        "yAxisTitle" : "Pkts recv"
                    },
    "nodeTsn"       : {
                        "chartTitle" : "Timeline",
                        "xAxisTitle" : "TSN",
                        "yAxisTitle" : "Nodes"
                    },
    "ccaTime"       : {
                        "chartTitle" : "Channel busy with Time",
                        "xAxisTitle" : "Time",
                        "yAxisTitle" : "CCA failures"
                    },
    "averagePower" : {
                        "chartTitle" : "Average Power level",
                        "xAxisTitle" : "NODES",
                        "yAxisTitle" : "Power level"
                    },
    "instantPower" : {
                        "chartTitle" : "Instantaneous Power Level",
                        "xAxisTitle" : "NODES",
                        "yAxisTitle" : "Instantaneous Power"
                    },
    "powerEtx" : {
                        "chartTitle"  : "Power Vs ETX",
                        "xAxisTitle"  : "Time",
                        "yAxisTitle"  : "Power",
                        "yAxisTitle2" : "ETX",
                        "yAxis2Max"   : null,
                        "thTitle"     : "ETX Threshold",
                        "thValue"     : "1.5"
                    },
    "txRxPdrNode" : {
                        "chartTitle"  : "Total Received/Sent per Node",
                        "xAxisTitle"  : "Nodes",
                        "yAxisTitle"  : "Total pkts received/sent",
                        "yAxisTitle2" : "PDR",
                        "yAxis2Max"   : 1,
                        "thTitle"     : "Theoritical PDR",
                        "thValue"     : "1"

                    },
    "powerEwmaEtx" : {
                        "chartTitle"  : "Power Vs EWMA ETX",
                        "xAxisTitle"  : "Time",
                        "yAxisTitle"  : "Power Level",
                        "yAxisTitle2" : "EWMA ETX",
                        "yAxis2Max"   : null,
                        "thTitle"     : "EWMA ETX Threshold",
                        "thValue"     : "1.5"
                    },


};

modRateArr = [6.25,12.5,25,50];

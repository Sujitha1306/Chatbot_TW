/*******************************************************************************
 * ======================================================================================================
 *                                     Copyright (C) 2019 Trackerwave Pvt Ltd.
 *                                             All rights reserved
 * ======================================================================================================
 * Notice:  All Rights Reserved.
 * This material contains the trade secrets and confidential business information of Trackerwave Pvt Ltd,
 * which embody substantial creative effort, design, ideas and expressions.  No part of this material may
 * be reproduced or transmitted in any form or by any means, electronic, mechanical, optical or otherwise
 * ,including photocopying and recording, or in connection with any information storage or retrieval
 * system, without written permission.
 *
 * www.trackerwave.com, Traceability and Change log maintained in Source Code Control System}
 * ======================================================================================================
******************************************************************************/

export class MapControl {
    public mapValue = {
        minZoom : 40,
        maxZoom : 160,
        defaultZoom : 100,
        disLocLevel : 100,
        orient : 0,
        coordinates : null,
        imageData   : null,
        direction : null
    };
}

export class NodeControl {
    public reader = {
        readerList : [],
        reader_points : [],
        reader_postion : {}
    };
    public ipSelect = {
        nodeTypes : [],
        exitNodeList : [],
        tempExitNodeList : [],
    };
    public ipButton = {
        isActiveNode : false,
        isGenerateNode : false,
        isShowReader : false,
        isAllDelete: true,
        isNodeLink : false,
        selectedToggle : 'create',
        isDistOpen : false
    };

    public mapNodes = {
        nodeData : [],
        newNodeData: [],
        nodePointData : [],
        exitPointData : [],
        activeNode : null,
        prevActiveNode : null,
        activeMarker : null,
        lastNode : 0,
        activeNodeId : null,
        typeValue : null,
        exitSpliceValue : null,
        exitNodeCount : 0,
        exitNodeFlag : 0,
        selectedExitList: [],
        isDelete : 0,
        noOfLinks : 0,
        noOfNodes : 0,
        distNodeList : [],
        distLinkId : null
    };
}
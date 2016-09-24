/**
 * This script is the same as ItemfulfillmentAutomation.js script. It creates item fulfillment from sales order.
 * The script is triggered automatically at a give time. script stops when there is no more sales other from which
 * IF can be created
 *
 * script type: schedule script
 */

function AutomateItemfulfillment() {
	nlapiLogExecution('ERROR', 'VERSION', 'V2015-08-15');
    var context     =   nlapiGetContext();
    var deployId    =   context.getDeploymentId();
    var scriptId    =   context.getScriptId();
    if(deployId == 'customdeploy1'){
        nlapiLogExecution('debug','cust deploy 1', 'triggering ASC / DESC / Q3 / Q4');
        nlapiScheduleScript('customscript173', 'customdeploy_lv_item_fulfillment_asc');
        nlapiScheduleScript('customscript173', 'customdeploy_lv_item_fulfillment_desc');
        nlapiScheduleScript('customscript173', 'customdeploy_lv_item_fulfillment_q3');
        nlapiScheduleScript('customscript173', 'customdeploy_lv_item_fulfillment_q4');
        return; /* NETSUITE: Added to exit the current deployment and allow the 2 deployments above to run */
    }
    if (context.getExecutionContext() != 'scheduled'){
        //return;
    }

    /* NETSUITE: Enclosed the search API in a do-while loop to repeatedly call the search until the search returns null */
    do{
        // When date changes while the fulfillment script is still running, script
        // starts picking Sales orders that have already been processed.
        var dateTime = new Date();
        var hour     = dateTime.getHours();
        if (hour + 3 >= 3 && hour + 3 < 20 ){
            var date = nlapiDateToString(nlapiAddDays(dateTime,-1));
        }
        else{
            var date = nlapiDateToString(nlapiAddDays(dateTime, 0));
        }
        var filter   = new Array();
        filter[0]= new nlobjSearchFilter('custbody_donotrefulfiltoday', null, 'isnot', date);
        /* NETSUITE Add Start: Used MOD({internalid},4) as a filter to properly divide the load to 4 queues */
        try{
            if(deployId == 'customdeploy_lv_item_fulfillment_asc'){
                filter[1] = new nlobjSearchFilter('formulanumeric',null,'equalto','0');
                filter[1].setFormula('MOD({internalid},4)');
            }
            else if (deployId == 'customdeploy_lv_item_fulfillment_desc'){
                filter[1] = new nlobjSearchFilter('formulanumeric',null,'equalto','1');
                filter[1].setFormula('MOD({internalid},4)');
            }
            else if (deployId == 'customdeploy_lv_item_fulfillment_q3'){
                filter[1] = new nlobjSearchFilter('formulanumeric',null,'equalto','2');
                filter[1].setFormula('MOD({internalid},4)');
            }
            else if (deployId == 'customdeploy_lv_item_fulfillment_q4'){
                filter[1] = new nlobjSearchFilter('formulanumeric',null,'equalto','3');
                filter[1].setFormula('MOD({internalid},4)');
            }
            /* NETSUITE Add End: */
            var searchresults = nlapiSearchRecord('salesorder', 2163 , filter, null);
        }
            /* NETSUITE : Added error handling when invoking search API to catch search timeouts.
             *  A notification email will be sent in the event of error.
             *  Script will be halted instead of re-scheduling to prevent infinite loop caused by timeouts.
             */
        catch(e){
            if(e instanceof nlobjError){
                nlapiLogExecution('ERROR', 'system error (line 66)', e.getCode() + '\n' + e.getDetails());
            }
            else{
                nlapiLogExecution('ERROR', 'unexpected error', e.toString());
            }
            body += 'The search of the Automated item fulfillment process has encountered an error. The process has been halted.';
            //nlapiSendEmail(4294702, 4294702,'Automate item fulfillment process encountered an error',body,['stephen.rich@beyondtherack.com']);
            return;
        }
        if(searchresults){
            if(searchresults.length < 500){
                //nlapiSendEmail(4294702, 4294702, 'Auto Fulfill Remaining Usage', 'IFs left to fulfill... ' + searchresults.length);
            }
            transformResults(searchresults,context,date);
        }
        else{
            var body  = 'Hello All,\n\n';
            body += 'The Automated item fulfillment process is completed. You can now print the packing slips Please.';
            //nlapiSendEmail(4294702, 4294702, 'Automate item fulfillment process is completed',body,['lee.finkelstein@beyondtherack.com','yael.barak@beyondtherack.com','Kyle.lawlor-stephenson@beyondtherack.com','Nicolas.guntaur@beyondtherack.com','eric.champagne@beyondtherack.com','claude-alain.germain@beyondtherack.com','Alain.Henein@beyondtherack.com','Ted.Guglielmi@beyondtherack.com']);
            //nlapiScheduleScript("customscript173", "customdeploy2");
            //nlapiScheduleScript("customscript174", "customdeploy2");

        }
        /* NETSUITE Add Start: Check for remaining usage unit and Yield the script once the user set threshold has been reached */
        try{
            if (context.getRemainingUsage() <= 500){
                var stateMain = nlapiYieldScript();
                if( stateMain.status == 'FAILURE'){
                    nlapiLogExecution("debug","Failed to yield script (do-while), exiting: Reason = "+ stateMain.reason + " / Size = "+ stateMain.size);
                    throw "Failed to yield script";
                }
                else if ( stateMain.status == 'RESUME' ){
                    nlapiLogExecution("debug", "Resuming script (do-while) because of " + stateMain.reason+". Size = "+ stateMain.size);
                }
            }
        }
        catch(e){
            if (e instanceof nlobjError) {
                nlapiLogExecution('ERROR', 'system error (line 104)', e.getCode() + '\n' + e.getDetails());
            }
            else{
                nlapiLogExecution('ERROR', 'unexpected error', e.toString());
            }
            nlapiScheduleScript(scriptId, deployId);
        }
        /* NETSUITE Add End: */
    }
    while(searchresults);
}

function transformResults(searchresults, context, date){
    var previousid = 0;
    for(var i in searchresults){
        /* NETSUITE: Enclosed the process in a try-catch block to handle errors.
         * Script will be re-scheduled when the call to nlapiYieldScript fails
         */
        try{
            var hasBeenProcessed = searchresults[i].getValue('custbody_donotrefulfiltoday');
            var sales_order_id = searchresults[i].getId();

nlapiLogExecution('ERROR', 'Processing Order Id', sales_order_id);

            var currentid = sales_order_id;

            if (currentid == previousid || hasBeenProcessed == date) {
                continue;
            }
            else {
                previousid = currentid;
            }
            var fulfillmentRecord = nlapiTransformRecord('salesorder', sales_order_id, 'itemfulfillment');
            var linecount = fulfillmentRecord.getLineItemCount('item');
            if (linecount == 0) {
                continue;
            }

            // ** Jan 22,2014 added to exclude new gift item
            if(fulfillmentRecord.getLineItemValue('item', 'item', 1) == 4023158)
            {
                //nlapiLogExecution('ERROR', 'Free gift', 'gift item ' + sales_order_id);
               //fulfillmentRecord.setLineItemValue('item','itemreceive', 1, 'F');
                //continue;
            }
            // ** Jan 22,2014 added to exclude new gift item

            getPreferedBin(fulfillmentRecord);

            //Add logic for add on items. Add on items cannot be shipped out only by themselves UNLESS they the only items left in the order
            //If this IF doesn't meet this requirement, we skip it
            var btrItemFulfillmentCommon = new BtrItemFulfillmentCommon(fulfillmentRecord,sales_order_id);
            if(!btrItemFulfillmentCommon.validItemFulfillment()){
            	nlapiSubmitField('salesorder', sales_order_id, 'custbody_donotrefulfiltoday', date, true);
            	continue;
            }
            
            var createdFrom             = fulfillmentRecord.getFieldValue('createdfrom');
            var fulfillmentShipGroup    = fulfillmentRecord.getFieldValue('custbody_custshipgrp');
            var fulfillmentStatus       = fulfillmentRecord.getFieldValue('status');

            var delayflag = 0;
            for(var n=1; n <= fulfillmentRecord.getLineItemCount('item'); n++)
            {
                if(delayflag == 0)
                {
                    var fulfillmentLocation = fulfillmentRecord.getLineItemValue('item', 'location', n);

                    if(fulfillmentRecord.getLineItemValue('item', 'itemreceive', n) == 'T' && fulfillmentLocation == 17 && fulfillmentShipGroup == 1)
                    {
                        delayflag = 1;
                        fulfillmentRecord.setFieldValue('custbody_delay_shipping_email','T');
                        nlapiSubmitField('salesorder', createdFrom, 'custbody_delay_shipping_email', 'T');
                    }
                }
            }

            fulfillmentRecord = checkShippingGuaranteeFlag(fulfillmentRecord);
            var idIF = nlapiSubmitRecord(fulfillmentRecord, true);

            /* NETSUITE Add Start:  Check for remaining usage unit and Yield the script once the user set threshold has been reached */
            if (context.getRemainingUsage() <= 500) {
                var stateMain = nlapiYieldScript();
                if( stateMain.status == 'FAILURE')
                {
                    nlapiLogExecution("debug","Failed to yield script (Transform Loop), exiting: Reason = "+ stateMain.reason + " / Size = "+ stateMain.size);
                    throw "Failed to yield script";
                }
                else if ( stateMain.status == 'RESUME' )
                {
                    nlapiLogExecution("debug", "Resuming script (Transform Loop) because of " + stateMain.reason+". Size = "+ stateMain.size);
                }
            }
            /* NETSUITE Add End: */
        }
        catch(e){
            if (e instanceof nlobjError) {
                nlapiLogExecution('ERROR', 'system error (line 197)', e.getCode() + '\n' + e.getDetails());
                continue;
            }
            else if(e.toString() != 'Failed to yield script'){
                nlapiLogExecution('ERROR', 'unexpected error', e.toString());
                if (i < searchresults.length){
                    if (context.getRemainingUsage() > 20) {
                        nlapiSubmitField('salesorder', sales_order_id, 'custbody_donotrefulfiltoday', date, true);
                    }
                    nlapiLogExecution('DEBUG', i + ' : ' + searchresults.length, 'Id = ' + sales_order_id + ' IF has not been created');
                    continue;
                }
                else{
                    return;
                }
            }
            nlapiLogExecution('ERROR', 'unexpected error', e.toString());
            nlapiScheduleScript(context.getScriptId(), context.getDeploymentId());
            return;
        }
    }
}

function getPreferedBin(order)
{
    var stBinList;        		          // hold the bin selected for a line
    var itembin;
    var QuantityInBins = new Array();     // store number of items in a bin location
    var currentBinQuantity = new Array();  // hold the quantity on hand for each line bin locations
    var recordtype = order.getRecordType();
    var intItemID;
    var dropshippo;         //holds the drop ship po column value of a line item
    var executionContext = nlapiGetContext();
    var location; // check if
    var bool = false;
    var justOneItemToFulfill = false;  // boolean to make sure that item fulfillment are not created with just the free shipping stuff.
    if( type=='ship' || recordtype != 'itemfulfillment' ) {
        return;
    }
    var holdfulfilment=order.getFieldValue('shipmethod');// hold the value of the ship via field. Internal id for hold shipment is 71867
    var createdfrom=order.getFieldText('createdfrom');
    var substring =createdfrom.substring(0, createdfrom.indexOf('#'));
    // Do not process an order if it is not created from a sales order.
    if (substring =='Sales Order ' || substring == 'Transfer Order '){
        var count = order.getLineItemCount('item');
        //Do not continue if there is no line item
        if (count ==null && count ==0 ){
            return;
        }
        for (var i=1; i<=count; i++){
            var location1= order.getLineItemValue('item','location', i);
            if (bool==false){
                location=location1;
            }
            //================================================================
            // Section to enable free shipping promo to be inserted on the packing slip and item fulfillment.
            var itemid = order.getLineItemValue('item','item', i);
            //for valmont gift bag
            if (itemid==1082455 && justOneItemToFulfill==false){
                nlapiLogExecution('DEBUG', 'Just one item is true');
                order.setLineItemValue('item','itemreceive', i, 'F');
                continue;
            }
            if ((itemid==604032 ||itemid==607150 ||itemid==607151 ||itemid==607152)&&  justOneItemToFulfill==true && location!=7){
                order.setLineItemValue('item','itemreceive', i, 'T');
                order.setLineItemValue('item','location', i, location);
                continue;
            }
            //================================================================

            // Do not fulfill the order if it has been put on a hold.
            // rec.getLineItemValue('item','itemreceive', i)=='F' enables users to manually unchecking a line item so that it shouldn't be fulfilled (in case of non stock)
            //executionContext.getRemainingUsage()<=100)  makes sure the fulfillment does not fail because it is over the usage limit
            // location !=location1 prevents shipping from multiple location

            /* NETSUITE Update Start: Removed the usage checking
             * if ((holdfulfilment == 71867)|| location !=location1 ||location !=1 || (order.getLineItemValue('item','itemreceive', i)=='F') * || (executionContext.getRemainingUsage()<=100) ){
             NETSUITE Update End: */

            if ((holdfulfilment == 71867)|| 17 !=location1 || (order.getLineItemValue('item','itemreceive', i)=='F')) {
                order.setLineItemValue('item','itemreceive', i, 'F');
                continue;
            }
            intItemID  = order.getLineItemValue('item', 'item', i);// get sku id
            dropshippo=order.getLineItemValue('item', 'createpo',i);
            // check the fulfill check box if item is a drop ship item
            if (dropshippo != null ) {
                order.setLineItemValue('item', 'itemreceive', i, 'F'); // prevent drop ship item from been fulfilled
                continue;
            }
            // get the bin location(isabey warehouse, sample, defective, NEG etc)
            //var location1=parseInt(rec.getLineItemValue('item', 'location', i));
            // set the bin column of the current line to an empty string
            order.setLineItemValue('item','binnumbers', i, "") ;
            if (i==1){
                QuantityInBins = GetBinQuantity(order,i);
            }
            else{
                var equalSkus=false; // boolean to check if we have pick from similar sku.
                for ( var j=1; j<i; j++){ // get the item code of line j(previous line)
                    var  intItemJID =order.getLineItemValue('item','item', j);
                    //compare the item code(sku) at current line with the item at the previous lines
                    if (intItemJID ==intItemID){
                        equalSkus =true;
                        break;
                    }
                }
                //Assign picking to the left over at previous sku bin location if the current sku is the same.
                //  as a previous sku( sku at j<i) on the item fulfillment record
                if(equalSkus==true){
                    QuantityInBins =currentBinQuantity[intItemJID];
                }
                else{
                    QuantityInBins = GetBinQuantity(order,i);
                }
            }
            // check if bins contain an item
            for (var y=0; y<QuantityInBins.length; y++){
                if (QuantityInBins[y]==0 || isNaN(QuantityInBins[y])){
                    continue;
                }
                else{

                    itembin =GetBins(order,i)[y];
                    var filters 		= new Array();
                    var resultColumns 	= new Array();
                    // ask for bin number to be included the search result
                    resultColumns[0] = new nlobjSearchColumn('custrecord_nonpickagebin');
                    resultColumns[1] = new nlobjSearchColumn('binnumber');
                    // Filter the result by the bin number
                    filters[0] = new nlobjSearchFilter('binnumber', null, 'is', itembin);

                    // get from the bin record all bin number and non pickable columns where bin number = current bin number (itembin)
                    var r = nlapiSearchRecord('bin', null, filters, resultColumns);

                    //check if a bin is a pickable bin and update the available quantity of the current sku item inventory.
                    if ( r!=null && (r[0].getValue('custrecord_nonpickagebin') =='F')){
                        QuantityInBins[y] = QuantityInBins[y]-1;
                        order.setLineItemValue('item','binnumbers', i, itembin);
                        break;
                    }

                    /* NETSUITE Add Start: Check for remaining usage unit and Yield the script once the user set threshold has been reached */
                    if (nlapiGetContext().getRemainingUsage() <= 50){
                        var stateBinQty = nlapiYieldScript();
                        if( stateBinQty.status == 'FAILURE'){
                            nlapiLogExecution("debug","Failed to yield script (GetBinQuantity), exiting: Reason = "+ stateBinQty.reason + " / Size = "+ stateBinQty.size);
                            throw "Failed to yield script";
                        }
                        else if ( stateBinQty.status == 'RESUME' ){
                            nlapiLogExecution("debug", "Resuming script (GetBinQuantity) because of " + stateBinQty.reason+". Size = "+ stateBinQty.size);
                        }

                    }
                    /* NETSUITE Add End: */

                }
            }
            currentBinQuantity[intItemID]= QuantityInBins;
            stBinList = order.getLineItemValue('item','binnumbers', i) ;
            // uncheck a line sku if the item is not in stock. when a line sku is unchecked, it will not
            // be fulfiilled.

            if( (stBinList != null && stBinList != undefined && stBinList != "") ){
                order.setFieldValue('custbody_skipprinting', 3);
                order.setFieldValue('custbody_printpackingslip', 'A');
                order.setLineItemValue('item','itemreceive', i, 'T');
                bool=true;
                justOneItemToFulfill =true;
            }
            else{
                order.setLineItemValue('item','itemreceive', i, 'F');
            }
        }

    }
}

/**
 * @param Line number
 * return the number of item within bins
 * @author Patrick Muh
 * @version 1.0
 */
function GetBinQuantity(order,i){
    var bin = new Array();
    //var rec =nlapiGetNewRecord();
    // array to store the quantity available
    var quantity_on_hand = new Array();

    var item_sku =order.getLineItemValue('item','item',i); // get the line sku internal id
    var location1=order.getLineItemValue('item','location',i);

    var sku_bin =GetBins(order,i); // get the bin available for a line sku

    /* NETSUITE Update Start: Moved 'nlapiLoadRecord' call outside of loop to avoid unnecessary API calls */
    var item =nlapiLoadRecord('inventoryitem',item_sku); // load the item inventory record for the item (itembin)
    var Item_Bin_Count = item.getLineItemCount('binnumber');
    /* NETSUITE Update End: */

    for (var z=0; sku_bin !=null && z<sku_bin.length; z++){
        itembin =sku_bin[z];
        // get the available quantity of item at the current bin location
        for (var f=1; f<=Item_Bin_Count; f++){
            var location2 =parseInt(item.getLineItemValue('binnumber', 'location', f));
            var bin = item.getLineItemText('binnumber', 'binnumber', f);
            if (location2==location1 && bin==itembin){
                // get the quantity on hand
                // update the quantity_on_hand array
                quantity_on_hand[z] = parseInt(item.getLineItemValue('binnumber', 'onhandavail', f));
                /* NETSUITE Add End: Added break point to prevent continuing the loop if condition has been met */
                break;
                /* NETSUITE Add End: */
            }
        }
    }
    return quantity_on_hand;
}

/**
 * @param Line number
 * return  bins location of a given line
 * @author Patrick Muh
 * @version 1.0
 */
function GetBins(order,i)
{   var bin = new Array();
    //var rec =nlapiGetNewRecord();
    var binlistArray;
    // get all the available bin for the bin
    var binList= order.getLineItemValue('item','itembinlist' , i);
    // convert the available bin into a bin array
    if (binList !=null){
        binlistArray= binList.split(')');
    }

    if (binlistArray !=null && binlistArray !=undefined && binlistArray !=''){
        for (var len=0;len<binlistArray.length-1; len ++){
            var bin_onhand=binlistArray[len];
            var opening_comma_index =bin_onhand.indexOf('(');
            if (len !=0){
                bin[len]= bin_onhand.substring(1, opening_comma_index); // get  the bin location of the item
            }
            else{
                bin[len]= bin_onhand.substring(0, opening_comma_index); // get  the bin location of the item
            }
        }
    }
    return 	bin;
}
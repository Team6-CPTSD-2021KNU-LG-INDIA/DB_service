/*
 * Copyright (c) 2020 LG Electronics Inc.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

// helloworld_webos_service.js
// is simple service, based on low-level luna-bus API

// eslint-disable-next-line import/no-unresolved
const pkgInfo = require('./package.json');
const Service = require('webos-service');

const service = new Service(pkgInfo.name); // Create service by service name on package.json
const logHeader = "[" + pkgInfo.name + "]";
const service_name='luna-send -n 1 -f -m com.palm.configurator luna://com.webos.service.db/';

service.register("ping", function(message) {
    console.log(logHeader, "SERVICE_METHOD_CALLED:/ping");
    console.log("Ping! setting up activity");
    const methodName = "luna://" + pkgInfo.name + "/pong";
    const activitySpec = {
        "activity": {
            "name": "My Activity", // this needs to be unique, per service
            "description": "do something", // required
            "background": true,    // can use foreground or background, or set individual properties (see Activity Specification below, for details)
            "persist": true,       // this activity will be persistent across reboots
            "explicit": true,      // this activity *must* be completed or cancelled explicitly, or it will be re-launched until it does
            "callback": {          // what service to call when this activity starts
                "method": methodName, // URI to service
                "params": {        // parameters/arguments to pass to service
                }
            }
        },
        "start": true,             // start the activity immediately when its requirements (if any) are met
        "replace": true,           // if an activity with the same name already exists, replace it
        "subscribe": false         // if "subscribe" is false, the activity needs to be adopted immediately, or it gets canceled
    };
    service.call("luna://com.webos.service.activitymanager/create", activitySpec, function(reply) {
        console.log(logHeader, "SERVICE_METHOD_CALLED:com.webos.service.activitymanager/create");
        const activityId = reply.payload.activityId;
        console.log("ActivityId = " + activityId);
        message.respond({msg: "Created activity "+ activityId});
    });
});

//list
//send_message
//recieve_message
service.register("createDB",function(message){
    const query={"query": {"from":"com.webos.service.event:1"}};
    const kind={ 
        "id":"com.webos.service.event:1",
        "owner":pkgInfo.name,
        "schema":{
            "type":"object",
            "properties":{
                "startTime":{
                    "type":"Date"
                },
                "endTime":{
                    "type":"Date"
                },
                "repeat":{
                    "type":"boolean"
                },
                "content":{
                    "type":"string"
                }
            }
        },
        "indexes":[
            {"name":"eve_sT","props":[{"name":"startTime"}]},
            {"name":"eve_eT","props":[{"name":"endTime"}]},
            {"name":"rpt","props":[{"name":"repeat"}]},
            {"name":"cnt","props":[{"name":"content"}]}
        ]
    };
    //message.payload.returnValue
    //message.payload.results[0].payload._id
    const permission={ 
        "permissions":[ 
           { 
              "operations":{ 
                 "read":"allow",
                 "create":"allow",
                 "update":"allow",
                 "delete":"allow"
              },
              "object":"com.webos.service.event:1",
              "type":"db.kind",
              "caller":pkgInfo.name
           }
        ]
    };

    service.call(service_name+'find',query,function(reply){
        if(reply.payload.returnValue){
            message.respond({msg:"already exists"});
        }
        else{
            service.call(service_name+'putKind',kind,function(reply){
                message.respond({msg:"create kind"});
                service.call(service_name+'putPermission',permission);
            })
        }
    })

});

service.register("enrollEvent",function(message){
    const start_time=new Date(message.payload.startTime);
    const end_time=new Date(message.payload.endTime);
    const kind_object={
        "objects":[ 
          { 
             "_kind":"com.webos.service.event:1",
             "startTime":start_time,
             "endTime":end_time,
             "repeat":message.payload.repeat,
             "content":message.payload.content
        }
    ]};

    service.call(service_name+'put',kind_object);
});

service.register("modifyEvent",function(message){
    const id=message.payload.id;
    const start_time=new Date(message.payload.startTime);
    const end_time=new Date(message.payload.endTime);
    const kind_object={
        "objects":[ 
          { 
             "id":id, 
             "_kind":"com.webos.service.event:1",
             "startTime":start_time,
             "endTime":end_time,
             "repeat":message.payload.repeat,
             "content":message.payload.content
        }
    ]}

    service.call(service_name+'put',kind_object);
});
service.register("deleteEvent",function(message){
    const id=messge.payload.id;
});

// service.register("ListEvent",function(message){
//     service.call(service_name+'find',{},);
// });
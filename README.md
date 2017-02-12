# BGH Smart Plugin for Homebridge

A [Homebridge](https://github.com/nfarina/homebridge) plugin for "BGH Smart Control Kit" or BGH Smart Control AC's (http://smartcontrol.bgh.com.ar/)

It uses https://bgh-services.solidmation.com/ API to interact with your registered devices

### Installation

```
npm install homebridge-bgh-smart -g
```

Add to your configuration

```
{
  "accessory": "BGH-Smart",
  "name": "Accesory Name",
  "email": "email@domain.com",
  "password": "password",
  "deviceName": "Device name in Solidmation",
  "homeId": "12345",
  "deviceId": "12345"
}
```

To help you finding homeId and deviceId paste this on the browser cosnole while logged in at the [Dashboard](https://bgh-services.solidmation.com/control/Panel.aspx) Source available in getDevicesHelper.js

```
function getDevices(a){jQuery.ajax({type:"POST",url:"https://bgh-services.solidmation.com/1.0/HomeCloudService.svc/GetDataPacket",contentType:"application/json",data:JSON.stringify({token:HCData.AccessToken,homeID:a,serials:{Home:0,Groups:0,Devices:0,Endpoints:0,EndpointValues:0,Scenes:0,Macros:0,Alarms:0},timeOut:1e4}),success:function(a){if(a.GetDataPacketResult.Endpoints.length>0)for(var b=0;b<a.GetDataPacketResult.Endpoints.length;b++){var c=a.GetDataPacketResult.Endpoints[b],d={accessory:"BGH-Smart",name:c.Description,email:"email@domain.com",password:"password",deviceName:c.Description,homeId:c.HomeID,deviceId:c.EndpointID};alert(JSON.stringify(d))}}})}var c=$.cookie("HCData");if(c){var HCData=JSON.parse(c);HCData.AccessToken={Token:decodeURIComponent(HCData.AccessToken)},HCData.FirstName=decodeURIComponent(HCData.FirstName),HCData.LastName=decodeURIComponent(HCData.LastName),jQuery.ajax({type:"POST",url:"https://bgh-services.solidmation.com/1.0/HomeCloudService.svc/EnumHomes",contentType:"application/json",data:JSON.stringify({token:HCData.AccessToken}),success:function(a){if(a.EnumHomesResult&&a.EnumHomesResult.Homes)for(var b=0;b<a.EnumHomesResult.Homes.length;b++){var c=a.EnumHomesResult.Homes[b];getDevices(c.HomeID)}}})}
```


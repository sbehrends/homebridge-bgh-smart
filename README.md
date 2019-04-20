# BGH Smart Plugin for Homebridge

A [Homebridge](https://github.com/nfarina/homebridge) plugin for "BGH Smart Control Kit" or BGH Smart Control AC's (http://smartcontrol.bgh.com.ar/)

It uses https://bgh-services.solidmation.com/ API to interact with your registered devices

### Major change from 1.0.0

On version <= 1.0.0 the behavior of the plugin changed. *Instead of being a configurable accesory* in your homebridge config file, now *it's a platform*.

*The configuration got easier and it will autodiscover all your available devices* in your account. (It only requires email and password)

![BGH Smart AC in Home](screenshot.jpg?raw=true "BGH Smart AC in Home")

### Installation

```
npm install homebridge-bgh-smart -g
```

Add to your homebridge configuration

```
"platforms": [{
  "platform": "BGH-Smart",
  "email": "email@domain.com",
  "password": "password"
}]
```

// index.js
const app = getApp();
import mqtt from "../../utils/mqtt.min";
let client = null; // MQTT服务
function inArray(arr, key, val) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i][key] === val) {
      return i;
    }
  }
  return -1;
}

// 将字符串转为 ArrayBuffer
function str2ab(str) {
  let buf = new ArrayBuffer(str.length);
  let bufView = new Uint8Array(buf);
  for (var i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

//ArrayBuffer转字符串
function ab2str(buffer) {
  let encodedString = String.fromCodePoint.apply(
    null,
    new Uint8Array(buffer)
  );
  let decodedString = decodeURIComponent(escape(encodedString));
  //没有这一步中文会乱码
  return decodedString;
}


Page({
  data: {
    title: 'BLE 控制器',
    MqttcontontDialog: false,// mqtt打开链接窗
    MqttisConnect: false,
    isPush: false,  // 是否订阅
    isSubscr: false, // 是否添加发布地址
    // 设备信息
    sensorList: [
      //传感器列表
      //图 名字 参数 值 单位 序号
      {
        img: "/img/sensor_icon/P1.png",
        name: "DHT22",
        parameter: "温度",
        value: 0,
        unit: "°C",
        idx: 0,
      },
      {
        img: "/img/sensor_icon/P2.png",
        name: "DHT22",
        parameter: "湿度",
        value: 0,
        unit: "%rh",
        // isPass: true,
        idx: 1,
      },
      {
        img: "/img/sensor_icon/P3.png",
        name: "TEMT6000",
        parameter: "光强",
        value: 0,
        unit: "lx",
        idx: 2,
      },
      {
        img: "/img/sensor_icon/P4.png",
        name: "MQ2",
        parameter: "烟雾",
        value: 0,
        unit: "ppm",
        idx: 3,
      },
    ],
    otherSensorList: [
      { img: "/img/sensor_icon/deng.png", name: "灯", isOpen: false },
      { img: "/img/sensor_icon/fan.png", name: "风扇", isOpen: false },
      {
        img: "/img/sensor_icon/chuanglian.png",
        name: "窗帘",
        schedule: 0, // 进度条
        isOpen: false,
      },
    ],
    // 链接输入框 本地有先用本地没有就输入
    address: wx.getStorageSync('address') || '',
    port: wx.getStorageSync('port') || '',
    username: wx.getStorageSync('username') || '',
    password: wx.getStorageSync('password') || '',
    push: wx.getStorageSync('push') || '',//订阅地址
    subscr: wx.getStorageSync('subscr') || '',//发布地址
    // 蓝牙
    isBluetooth: false,//是否是蓝牙模式
    DialogBluetooth: false,  //弹窗
    devices: [],
    connected: false,//蓝牙没有连接
    chs: [],

  },
  onLoad() { },
  // 打开下拉开关
  openDialog() {
    this.setData({ MqttcontontDialog: true }); // 将弹窗参数设置为true
  },
  onClose() {
    this.setData({ MqttcontontDialog: false }); // 将弹窗参数设置为false
  },
  // mqtt链接方法
  connectMqtt() {
    console.log(
      this.data.address, // 输入的连接地址
      this.data.port, // 输入的端口号
      this.data.username, // 输入的用户名
      this.data.password, // 输入的密码
    );

    let that = this;
    const options = {
      connectTimeout: 4000,
      address: this.data.address, // 输入的连接地址
      port: this.data.port, // 输入的端口号
      username: this.data.username, // 输入的用户名
      password: this.data.password, // 输入的密码
    };

    console.log("address是：", options.address);
    client = mqtt.connect("wxs://" + options.address + "/mqtt", options); // 连接方法
    client.on("connect", error => {
      console.log("连接成功");
      // 可以在这里写一些连接成功的逻辑

      wx.setStorageSync('address', options.address);
      wx.setStorageSync('port', options.port)
      wx.setStorageSync('username', options.username);
      wx.setStorageSync('password', options.password);
      this.setData({ MqttisConnect: true });
      wx.showToast({ icon: "none", title: "连接成功", })
    });

    client.on("reconnect", error => {
      console.log("正在重连：", error);
      wx.showToast({ icon: "none", title: "正在重连", });
    });
    client.on("error", error => {
      console.log("连接失败：", error);
      wx.showToast({ icon: "none", title: "MQTT连接失败", });
    });
    client.on("message", (topic, message) => {

      console.log("topic:", topic, "收到消息：", message.toString());
     
      //========================================
      let getMessageObj = {}; //收到的消息
      getMessageObj = JSON.parse(message); //收到的消息转换成json对象
      // 这里可以简化语法 用于教学仅提供最基本的示例
      if (getMessageObj.hasOwnProperty("TEMP"))
        this.setData({
          /*这里的sensorList为上面定义的传感器设备数据的数组 如果包含某项数据将更新那条数据 会自动刷新视图和百分比*/
          "sensorList[0].value": getMessageObj.TEMP ? Number(getMessageObj.TEMP) : 0,
        });
      if (getMessageObj.hasOwnProperty("HUMIDITY"))
        this.setData({
          "sensorList[1].value": Number(getMessageObj.HUMIDITY),
        });
      if (getMessageObj.hasOwnProperty("LIGLX")) //光强
        this.setData({
          "sensorList[2].value": Number(getMessageObj.LIGLX),
        });
      if (getMessageObj.hasOwnProperty("SMOKE"))
        this.setData({
          "sensorList[3].value": Number(getMessageObj.SMOKE),
        });
      if (getMessageObj.hasOwnProperty("CURATIN"))
        this.setData({
          "otherSensorList[2].schedule": Number(getMessageObj.CURATIN),
        });
      //========================================================
    });
  },
  // 断开连接
  closemqttConnect() {
    client.end();
    this.setData({ MqttisConnect: false, isSubscr: false, isPush: false })
    client = null;
    wx.showToast({ icon: "none", title: "MQTT 已断开", });

  },
  /*  订阅一个主题 */
  addPush() {
    let that = this
    if (!this.data.MqttisConnect) {
      wx.showToast({ icon: "none", title: "请先连接", });
      return
    }
    // 订阅一个主题
    client.subscribe(this.data.push, { qos: 0 }, function (err) {
      if (!err) {
        console.log("订阅成功成功");
        wx.showToast({ icon: "none", title: "订阅成功" });
        // 可以在这里写一些订阅主题成功的逻辑
        that.setData({ isPush: true });
        wx.setStorageSync('push', that.data.push);
      }
    });
  },
  // 取消订阅
  unaddPush() {
    let that = this
    client.unsubscribe(this.data.push, function (err) {
      if (!err) {
        // 可以在这里写一些取消主题成功的逻辑
        that.setData({ isPush: false });
        wx.showToast({ icon: "none", title: "取消成功", });


      }
    });
  },

  // 发布
  addSubscr() {
    if (!this.data.MqttisConnect) {
      wx.showToast({ icon: "none", title: "请先连接", });
      return
    }
    // 订阅一个主题
    let that = this
    client.subscribe(this.data.subscr, { qos: 0 }, function (err) {
      if (!err) {

        // 可以在这里写一些订阅主题成功的逻辑
        that.setData({ isSubscr: true });
        wx.setStorageSync('subscr', that.data.subscr);
        console.log("添加成功");
        wx.showToast({ icon: "none", title: "添加成功" });
      }
    });
  },
  changeaddSubscr() {
    // 订阅一个主题
    let that = this
    client.subscribe(this.data.subscr, { qos: 0 }, function (err) {
      if (!err) {
        // 可以在这里写一些订阅主题成功的逻辑
        wx.setStorageSync('subscr', that.data.subscr);
        console.log("修改成功");
        wx.showToast({ icon: "none", title: "修改成功" });
      }
    });
  },
  openBluetoothAdapter() {
    // 先关闭蓝牙模块再开启 防止断开后点连接连接不上
    this.closeBluetoothAdapter();

    wx.openBluetoothAdapter({
      success: response => {
        console.log("初始化蓝牙模块成功：openBluetoothAdapter", response);
        this.startBluetoothDevicesDiscovery();
      },
      fail: err => {
        if (err.errCode === 10001) {
          /* 监听蓝牙适配器状态变化事件 */
          wx.onBluetoothAdapterStateChange(res => {
            console.log("监听蓝牙适配器状态变化事件：onBluetoothAdapterStateChange", res);
            res.available && this.startBluetoothDevicesDiscovery();
          });
        }
      },
    });
  },
  /* 获取本机蓝牙适配器状态 */
  getBluetoothAdapterState() {
    wx.getBluetoothAdapterState({
      success: res => {
        console.log("getBluetoothAdapterState", res);
        if (res.discovering) {
          // 是否正在搜索设备
          this.onBluetoothDeviceFound();
        } else if (res.available) {
          // 蓝牙适配器是否可用
          this.startBluetoothDevicesDiscovery();
        }
      },
    });
  },
  /* 开始搜寻附近的蓝牙外围设备 */
  startBluetoothDevicesDiscovery() {
    // 开始扫描参数
    if (this._discoveryStarted) return;

    this._discoveryStarted = true;
    wx.startBluetoothDevicesDiscovery({
      allowDuplicatesKey: true,
      success: response => {
        console.log("开始搜寻附近的蓝牙外围设备：startBluetoothDevicesDiscovery", response);
        this.onBluetoothDeviceFound();
      },
      fail: err => {
        console.log("搜索设备失败", err);
        wx.showToast({ title: "搜索设备失败", icon: "none" });
      },
    });
  },
  /* 停止搜寻附近的蓝牙外围设备。*/
  stopBluetoothDevicesDiscovery() {
    console.log("停止搜寻附近的蓝牙外围设备");
    wx.stopBluetoothDevicesDiscovery();
  },
  /* 监听搜索到新设备的事件 */
  onBluetoothDeviceFound() {
    wx.onBluetoothDeviceFound(res => {
      res.devices.forEach(device => {
        if (!device.name && !device.localName) {
          return;
        }

        const foundDevices = this.data.devices;
        const idx = inArray(foundDevices, "deviceId", device.deviceId);
        const data = {};
        if (idx === -1) {
          data[`devices[${foundDevices.length}]`] = device;
        } else {
          data[`devices[${idx}]`] = device;
        }
        this.setData(data);
      });
    });
  },
  /* 连接蓝牙低功耗设备。*/
  createBLEConnection(e) {
    const ds = e.currentTarget.dataset;
    const deviceId = ds.deviceId;
    const name = ds.name;
    wx.createBLEConnection({
      deviceId,
      success: () => {
        this.setData({ connected: true, name, deviceId });
        wx.showToast({ title: "连接蓝牙设备成功", icon: "none" });
        this.getBLEDeviceServices(deviceId);
      },
      fail: e => {
        console.log("连接失败", e.errMsg);
        wx.showToast({ title: "连接失败,错误信息: " + e.errMsg, icon: "none" });
      },
    });
    // 停止搜寻蓝牙设备
    this.stopBluetoothDevicesDiscovery();
  },
  /* 断开与蓝牙低功耗设备的连接。 */
  closeBLEConnection() {
    console.log("断开与蓝牙低功耗设备的连接");
    wx.showToast({ title: "已断开和蓝牙设备的连接", icon: "none" });
    wx.closeBLEConnection({ deviceId: this.data.deviceId });
    this.setData({ connected: false, chs: [], canWrite: false });
  },
  /* 获取蓝牙低功耗设备所有服务 (service) */
  getBLEDeviceServices(deviceId) {
    wx.getBLEDeviceServices({
      deviceId,
      success: res => {
        for (let i = 0; i < res.services.length; i++) {
          if (res.services[i].isPrimary) {
            this.getBLEDeviceCharacteristics(deviceId, res.services[i].uuid);
            return;
          }
        }
      },
    });
  },
  /* 获取蓝牙低功耗设备某个服务中所有特征 (characteristic)。 */
  getBLEDeviceCharacteristics(deviceId, serviceId) {
    wx.getBLEDeviceCharacteristics({
      deviceId,
      serviceId,
      success: res => {
        console.log("获取蓝牙低功耗设备某个服务中所有特征：getBLEDeviceCharacteristics");

        for (let i = 0; i < res.characteristics.length; i++) {
          let item = res.characteristics[i];
          if (item.properties.read) {
            wx.readBLECharacteristicValue({ deviceId, serviceId, characteristicId: item.uuid });
          }
          if (item.properties.write) {
            this.setData({ canWrite: true });
            this._deviceId = deviceId;
            this._serviceId = serviceId;
            this._characteristicId = item.uuid;
            //   this.writeBLECharacteristicValue();
          }
          if (item.properties.notify || item.properties.indicate) {
            wx.notifyBLECharacteristicValueChange({
              deviceId,
              serviceId,
              characteristicId: item.uuid,
              state: true,
              success(res) {
                console.log("notifyBLECharacteristicValueChange success", res);
              },
            });
          }
        }
      },
      fail(res) {
        console.error("getBLEDeviceCharacteristics", res);
      },
    });

    // 操作之前先监听，保证第一时间获取数据
    wx.onBLECharacteristicValueChange(characteristic => {
      // TODO 收到的信息为ArrayBuffer类型，可根据自己的需要转换 可发送给父组件用来回显
      console.log("收到原始的数据", ab2str(characteristic.value));
      let getMessageObj = {}; //收到的消息
      getMessageObj = JSON.parse(ab2str(characteristic.value)); //收到的消息转换成json对象
      // 这里可以简化语法 用于教学仅提供最基本的示例
      if (getMessageObj.hasOwnProperty("TEMPERATURE"))
        this.setData({
          /*这里的sensorList为上面定义的传感器设备数据的数组 如果包含某项数据将更新那条数据 会自动刷新视图和百分比*/
          "sensorList[0].value": getMessageObj.TEMPERATURE ? Number(getMessageObj.TEMPERATURE) : 0,
        });
      if (getMessageObj.hasOwnProperty("HUMIDITY"))
        this.setData({
          "sensorList[1].value": Number(getMessageObj.HUMIDITY),
        });
      if (getMessageObj.hasOwnProperty("LIGHT_INTENSITY"))
        this.setData({
          "sensorList[2].value": Number(getMessageObj.LIGHT_INTENSITY),
        });
      if (getMessageObj.hasOwnProperty("SMOKE"))
        this.setData({
          "sensorList[3].value": Number(getMessageObj.SMOKE),
        });
      if (getMessageObj.hasOwnProperty("CURATIN_PROGRESS"))
        this.setData({
          "otherSensorList[2].schedule": Number(getMessageObj.CURATIN_PROGRESS),
        });


      // 测试向设备发送数据
      //  this.writeBLECharacteristicValue(JSON.stringify({"FAN":"OFF"}))
    });
  },
  /* 向蓝牙低功耗设备特征值中写入二进制数据 */
  writeBLECharacteristicValue(jsonStr) {
    let arrayBufferValue = str2ab(jsonStr);
    console.log("发送数据给蓝牙", "原始字符串", jsonStr, "转换arrayBuffer", arrayBufferValue);

    wx.writeBLECharacteristicValue({
      deviceId: this._deviceId,
      serviceId: this._serviceId, // 微信文档上是错误的
      characteristicId: this._characteristicId,
      value: arrayBufferValue, // 只能发送arrayBuffer类型数据
      success(res) {
        console.log("消息发送成功", res.errMsg);
        wx.showToast({ title: "消息发送成功", icon: "none" });
      },
      fail(e) {
        console.log("发送消息失败", e);
        wx.showToast({ title: "发送消息失败,错误信息: " + e.errMsg, icon: "none" });
      },
    });
  },
  closeBluetoothAdapter() {
    console.log("关闭蓝牙模块");
    wx.closeBluetoothAdapter();
    this._discoveryStarted = false;
  },
  // 灯的状态
  systemChange(e) {
    /* { LIGHT: "ON"} { LIGHT: "OFF" } { FAN: "ON" }{ FAN: "OFF" }   { CURTAIN: "ON" }  */
    let that = this
    console.log(e.detail.value);
    let ClinkData = e.target.dataset.param
    let msg
    let value = e.detail.value
    // 在里面添加一个蓝牙状态
    // console.log(ClinkData);
    if (ClinkData.name === '灯') {
      if (!value) {
        msg = { LIGHT: "OFF" }
      } else {
        msg = { LIGHT: "ON" }
      }
    }
    if (ClinkData.name === '风扇') {
      if (!value) {
        msg = { FAN: "OFF" }
      } else {
        msg = { FAN: "ON" }
      }
    }
    if (ClinkData.name === '窗帘') {
      if (!value) {
        msg = { CURTAIN: "OFF" }
      } else {
        msg = { CURTAIN: "ON" }
      }
    }
    // 如果是mqtt模式 
    if (!this.data.isBluetooth && this.data.MqttisConnect) {
      // 你发出去自己也要来一发不然怎么知道发出去没哈哈哈
      client.subscribe(this.data.subscr, { qos: 0 }, function (err) {
        if (!err) {
          console.log("发出的消息", msg);
          client.publish(that.data.subscr, JSON.stringify(msg));
        }
      });
    }
    if (this.data.isBluetooth && this.data.connected) {
      this.writeBLECharacteristicValue(JSON.stringify(msg));
    }

  },
  // 切换模式
  bluetoothChange(e) {
    console.log(e.detail.value);
    // this.setData({ isBluetooth: e.detail.value });
    this.setData({ isBluetooth: e.detail.value });
    if (this.data.isBluetooth && this.data.MqttisConnect) {
      this.closemqttConnect();
    }
    if (!this.data.isBluetooth) {
      this.closeBLEConnection();
    }

  },
  //下拉窗口
  openDialogBluetooth() {
    this.setData({ DialogBluetooth: true });

  },
  onCloseBluetooth() {
    this.setData({ DialogBluetooth: false });
  },


});


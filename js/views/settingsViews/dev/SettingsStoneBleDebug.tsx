import { LiveComponent }          from "../../LiveComponent";
import * as React from 'react';
import {
  Alert,
  ScrollView,
  Text,
  View
} from "react-native";

import { BackgroundNoNotification } from '../../components/BackgroundNoNotification'
import { ListEditableItems } from '../../components/ListEditableItems'
import { availableScreenHeight, colors, screenWidth } from "../../styles";
import { Util } from "../../../util/Util";
import { Scheduler } from "../../../logic/Scheduler";
import { core } from "../../../core";
import { xUtil } from "../../../util/StandAloneUtil";
import { IconButton } from "../../components/IconButton";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { BatchCommandHandler } from "../../../logic/BatchCommandHandler";
import { DataUtil } from "../../../util/DataUtil";
import { LOGe } from "../../../logging/Log";
import { Graph } from "../../components/graph/Graph";
import { StoneUtil } from "../../../util/StoneUtil";

const triggerId = "SettingsStoneBleDebug";

export class SettingsStoneBleDebug extends LiveComponent<any, any> {
  unsubscribeNative : any[] = [];
  _crownstoneId : number;
  _ibeaconUuid : string;
  _major  : string;
  _minor  : string;
  _handle : string;

  constructor(props) {
    super(props);
    const store = core.store;
    let state = store.getState();
    let sphere = state.spheres[props.sphereId];
    let stone = sphere.stones[props.stoneId];

    this._ibeaconUuid  = sphere.config.iBeaconUUID;
    this._crownstoneId = stone ? stone.config.crownstoneId : null;
    this._major        = stone ? stone.config.iBeaconMajor : null;
    this._minor        = stone ? stone.config.iBeaconMinor : null;
    this._handle       = stone ? stone.config.handle       : null;

    this.state = {
      advertisementPayload: '',
      directAdvertisementPayload: '',
      advertisementStateExternal: false,
      directAdvertisementStateExternal: false,
      advertisementTimestamp: null,
      directAdvertisementTimestamp: null,
      ibeaconPayload: '',
      ibeaconTimestamp: null,
      debugInformationText: null,
      debugData1: null,
      debugData2: null,
      debugTimestamp: new Date().valueOf(),
      debugDataHash: null,
      annotation: ''
    };
  }

  componentDidMount() {
    this.unsubscribeNative.push(core.nativeBus.on(core.nativeBus.topics.iBeaconAdvertisement, (data) => { this._parseIBeacon(data) }));
    this.unsubscribeNative.push(core.nativeBus.on(core.nativeBus.topics.advertisement, (data) => { this._parseAdvertisement(data) }));
    Scheduler.setRepeatingTrigger(triggerId, {repeatEveryNSeconds : 1});
    Scheduler.loadCallback(triggerId, () => { this.forceUpdate(); })
  }

  _parseIBeacon(data : ibeaconPackage[]) {
    if (this._major === null && this._minor === null) {
      this.setState({ibeaconPayload: xUtil.stringify(data, 2), ibeaconTimestamp: new Date().valueOf()});
      return
    }

    data.forEach((ibeacon) => {
      if (ibeacon.uuid.toLowerCase() !== this._ibeaconUuid.toLowerCase() ) { return; }
      if (this._major && ibeacon.major !== this._major)                    { return; }
      if (this._minor && ibeacon.minor !== this._minor)                    { return; }

      this.setState({ibeaconPayload: xUtil.stringify(ibeacon, 2), ibeaconTimestamp: new Date().valueOf()});
    })
  }

  _parseAdvertisement(data : crownstoneAdvertisement) {
    if (!data.serviceData) { return; }

    let newData : any = {};
    let changes = false;

    if (data.serviceData.crownstoneId === this._crownstoneId || !this._crownstoneId) {
      newData['advertisementStateExternal'] = data.serviceData.stateOfExternalCrownstone;
      newData["advertisementPayload"] = xUtil.stringify(data, 2);
      newData["advertisementTimestamp"] = new Date().valueOf();
      changes = true;
    }

    if (data.handle === this._handle || !this._handle) {
      newData['directAdvertisementStateExternal'] = data.serviceData.stateOfExternalCrownstone;
      newData["directAdvertisementPayload"] = xUtil.stringify(data, 2);
      newData["directAdvertisementTimestamp"] = new Date().valueOf();
      changes = true;
    }

    if (changes) {
      this.setState(newData);
    }
  }

  componentWillUnmount() {
    Scheduler.removeTrigger(triggerId);
    this.unsubscribeNative.forEach((unsubscribe) => { unsubscribe() });
  }

  _getItems() {
    let items = [];

    const store = core.store;
    let state = store.getState();
    let sphere = state.spheres[this.props.sphereId];
    let stone = sphere.stones[this.props.stoneId];



    items.push({
      label: "Get Behaviour Debug Information",
      icon: <IconButton name={"md-code-working"} size={25} color={colors.white.hex} buttonStyle={{ backgroundColor: colors.csBlue.hex }}/>,
      type: 'navigation',
      callback: () => {
        this.setState({debugInformationText: null, debugData: null});
        core.eventBus.emit("showLoading", "Getting Debug Info...");

        BatchCommandHandler.loadPriority(stone, this.props.stoneId, this.props.sphereId, {commandName: 'getBehaviourDebugInformation'}, {}, 2, "From StoneDebug")
          .then((returnData) => {
            core.eventBus.emit("hideLoading");

            const mapBitmaskArray = (arr) => {
              let result = "None";
              for (let i = 0; i < arr.length; i++) {
                if (result === "None" && arr[i]) {
                  result = i + '';
                }
                else if (arr[i]) {
                  result += ", " + i
                }
              }
              return result;
            }

            let data = returnData.data;

            data.activeBehaviours = mapBitmaskArray(data.activeBehaviours);
            data.activeEndConditions = mapBitmaskArray(data.activeEndConditions);

            data.behavioursInTimeoutPeriod = mapBitmaskArray(data.behavioursInTimeoutPeriod);

            data.presenceProfile_0 = mapBitmaskArray(data.presenceProfile_0);
            data.presenceProfile_1 = mapBitmaskArray(data.presenceProfile_1);
            data.presenceProfile_2 = mapBitmaskArray(data.presenceProfile_2);
            data.presenceProfile_3 = mapBitmaskArray(data.presenceProfile_3);
            data.presenceProfile_4 = mapBitmaskArray(data.presenceProfile_4);
            data.presenceProfile_5 = mapBitmaskArray(data.presenceProfile_5);
            data.presenceProfile_6 = mapBitmaskArray(data.presenceProfile_6);
            data.presenceProfile_7 = mapBitmaskArray(data.presenceProfile_7);

            data.storedBehaviours = mapBitmaskArray(data.storedBehaviours);

            let string = xUtil.stringify(data, 2);
            LOGe.info("STONE DEBUG INFORMATION:", string);
            this.setState({debugInformationText: string});
          })
          .catch((err) => {
            core.eventBus.emit("hideLoading");
            Alert.alert("Something went wrong", err, [{text:"Damn."}]);
          })
        BatchCommandHandler.executePriority()
      }
    });

    items.push({
      label: "Get Crownstone Uptime",
      icon: <IconButton name={"ios-clock"} size={25} color={colors.white.hex} buttonStyle={{ backgroundColor: colors.csBlueLight.hex }}/>,
      type: 'navigation',
      callback: () => {
        this.setState({debugInformationText: null, debugData1: null, debugData2: null});
        core.eventBus.emit("showLoading", "Getting Crownstone Uptime...");

        BatchCommandHandler.loadPriority(stone, this.props.stoneId, this.props.sphereId, {commandName: 'getCrownstoneUptime'}, {}, 2, "From StoneDebug")
          .then((returnData) => {
            core.eventBus.emit("hideLoading");
            let data = returnData.data;
            LOGe.info("STONE DEBUG INFORMATION: UPTIME", data);
            this.setState({debugInformationText: xUtil.getDurationFormat(data*1000)});
          })
          .catch((err) => {
            core.eventBus.emit("hideLoading");
            Alert.alert("Something went wrong", err, [{text:"Damn."}]);
          })
        BatchCommandHandler.executePriority()
      }
    });

    items.push({
      label: "Get ADC Restarts",
      icon: <IconButton name={"ios-outlet"} size={25} color={colors.white.hex} buttonStyle={{ backgroundColor: colors.csBlueLighter.hex }}/>,
      type: 'navigation',
      callback: () => {
        this.setState({debugInformationText: null, debugData1: null, debugData2: null});
        core.eventBus.emit("showLoading", "Get ADC Restarts...");

        BatchCommandHandler.loadPriority(stone, this.props.stoneId, this.props.sphereId, {commandName: 'getAdcRestarts'}, {}, 2, "From StoneDebug")
          .then((returnData) => {
            core.eventBus.emit("hideLoading");
            let data : AdcRestart = returnData.data;
            LOGe.info("STONE DEBUG INFORMATION: getAdcRestarts", data);
            let resultString = "\n\nRestarts:" + data.restartCount + "\n\nLast ADC restart: " + xUtil.getDateTimeFormat(StoneUtil.crownstoneTimeToTimestamp(data.timestamp))

            this.setState({debugInformationText: resultString});
          })
          .catch((err) => {
            core.eventBus.emit("hideLoading");
            Alert.alert("Something went wrong", err, [{text:"Damn."}]);
          })
        BatchCommandHandler.executePriority()
      }
    });

    items.push({
      label: "Get Switch History",
      icon: <IconButton name={"ios-list-box"} size={25} color={colors.white.hex} buttonStyle={{ backgroundColor: colors.csBlueLight.hex }}/>,
      type: 'navigation',
      callback: () => {
        this.setState({debugInformationText: null, debugData1: null, debugData2: null});
        core.eventBus.emit("showLoading", "Get switch history...");

        BatchCommandHandler.loadPriority(stone, this.props.stoneId, this.props.sphereId, {commandName: 'getSwitchHistory'}, {}, 2, "From StoneDebug")
          .then((returnData) => {
            core.eventBus.emit("hideLoading");
            let data : SwitchHistory[] = returnData.data;
            LOGe.info("STONE DEBUG INFORMATION: SwitchHistory", data);
            let resultString = "";
            let getSource = function(switchHistory) {
              let str = '';
              switch(switchHistory.sourceType) {
                case 0:
                  switch(switchHistory.sourceId) {
                    case 0:
                      str = "None"; break;
                    case 2:
                      str =  "Internal"; break;
                    case 3:
                      str =  "Uart"; break;
                    case 4:
                      str =  "Connection"; break;
                    case 5:
                      str =  "Switchcraft"; break;
                    case 5:
                      str =  "TapToToggle"; break;
                    default:
                      str = 'UNKNOWN'
                  }
                  break;
                case 1:
                  str =  "Behaviour ID: " + switchHistory.sourceId; break;
                case 3:
                  str =  "Broadcast DeviceId: " + switchHistory.sourceId; break;
              }
              if (switchHistory.viaMesh) {
                str += " via mesh"
              }
              else {
                str += " directly."
              }
              return str;
            }
            data.forEach((switchHistory) => {
              resultString += xUtil.getDateTimeFormat(StoneUtil.crownstoneTimeToTimestamp(switchHistory.timestamp)) +
                "\n" + switchHistory.switchCommand +
                " -> " + switchHistory.switchState +
                " from:" + getSource(switchHistory) + "\n\n";
            })

            this.setState({debugInformationText: resultString});
          })
          .catch((err) => {
            core.eventBus.emit("hideLoading");
            Alert.alert("Something went wrong", err, [{text:"Damn."}]);
          })
        BatchCommandHandler.executePriority()
      }
    });

    items.push({
      label: "Get triggered switchcraft buffers",
      icon: <IconButton name={"md-bulb"} size={25} color={colors.white.hex} buttonStyle={{ backgroundColor: colors.csBlue.hex }}/>,
      type: 'navigation',
      callback: () => {
        this.setState({debugInformationText: null, debugData1: null, debugData2: null, debugTimestamp: null, debugDataHash: null});
        core.eventBus.emit("showLoading", "Get triggered switchcraft buffers...");
        this.getBuffers(stone, "triggeredSwitchcraft")
      }
    });
    items.push({
      label: "Get missed switchcraft buffers",
      icon: <IconButton name={"ios-bulb"} size={25} color={colors.white.hex} buttonStyle={{ backgroundColor: colors.csBlueDark.hex }}/>,
      type: 'navigation',
      callback: () => {
        this.setState({debugInformationText: null, debugData1: null, debugData2: null, debugTimestamp: null, debugDataHash: null});
        core.eventBus.emit("showLoading", "Get missed switchcraft buffers...");
        this.getBuffers(stone, "missedSwitchcraft")
      }
    });
    items.push({
      label: "Get filtered buffers",
      icon: <IconButton name={"ios-podium"} size={25} color={colors.white.hex} buttonStyle={{ backgroundColor: colors.csBlue.hex }}/>,
      type: 'navigation',
      callback: () => {
        this.setState({debugInformationText: null, debugData1: null, debugData2: null, debugTimestamp: null, debugDataHash: null});
        core.eventBus.emit("showLoading", "Get filtered buffer...");
        this.getBuffers(stone, "filteredBuffer")
      }
    });
    items.push({
      label: "Get unfiltered buffers",
      icon: <IconButton name={"md-stats"} size={25} color={colors.white.hex} buttonStyle={{ backgroundColor: colors.csBlueLight.hex }}/>,
      type: 'navigation',
      callback: () => {
        this.setState({debugInformationText: null, debugData1: null, debugData2: null, debugTimestamp: null, debugDataHash: null});
        core.eventBus.emit("showLoading", "Get unfiltered buffer...");
        this.getBuffers(stone, "unfilteredBuffer")
      }
    });

    if (this.state.debugInformationText) {
      items.push({
        __item:
          <View style={{
            backgroundColor: colors.white.hex,
            minHeight: 300
          }}>
            <Text style={{
              padding: 15,
              color: colors.black.hex,
              fontSize: 12
            }}>{this.state.debugInformationText}</Text>
          </View>
      });
    }

    if (this.state.debugData1) {
      items.push({
        __item:
          <View style={{
            backgroundColor: colors.white.hex,
            minHeight: 300
          }}>
            <Text>{xUtil.getDateTimeFormat(StoneUtil.crownstoneTimeToTimestamp(this.state.debugTimestamp))}</Text>
            <Graph
              width={screenWidth}
              height={availableScreenHeight / 2}
              data={this.state.debugData1}
              dataHash={this.state.debugDataHash}
              live={false}
              autofit={true}
              options={{ shaded: false, interpolation: false }}
              fade={false}
              showPoints={false}
              lineColor={'red'}
              hideUI={true}
            />
          </View>
      });
    }
    if (this.state.debugData2) {
      items.push({
        __item:
          <View style={{
            backgroundColor: colors.white.hex,
            minHeight: 300
          }}>
            <Text>{ "Current:" }</Text>
            <Graph
              width={screenWidth}
              height={availableScreenHeight/2}
              data={this.state.debugData2}
              dataHash={this.state.debugDataHash}
              live={false}
              autofit={true}
              options={{shaded: false, interpolation: false}}
              fade={false}
              showPoints={false}
              lineColor={'red'}
              hideUI={true}
            />
          </View>
      });
    }

    items.push({
      label: "Annotate",
      type: 'textEdit',
      value: this.state.annotation,
      callback: (newText) => {
        this.setState({annotation: newText});
      },
      endCallback: (newText) => {
        if (newText) {
          LOGe.info("ANNOTATION: ", newText)
          Alert.alert("Annotated!", '', [{ text: "That is amazing!" }]);
          this.setState({ annotation: '' })
        }
      }
    })


    let largeLabel = 'Examining Sphere';
    if (stone) {
      largeLabel = "Examining \"" + stone.config.name + "\"\nMAC address: \"" + stone.config.macAddress;
    }

    items.push({label: largeLabel, type: 'largeExplanation'});
    items.push({label: "iBeacon UUID" + this._ibeaconUuid.toUpperCase() + "\nMajor:" + this._major+ "\nMinor:" +this._minor+ "\nHandle:" + this._handle, type: 'explanation', style: { paddingTop:0, paddingBottom:0 } });
    items.push({label: "Latest iBeacon data:", type: 'largeExplanation', style:{paddingTop:0}});
    items.push({__item:
      <View style={{backgroundColor: colors.white.hex, minHeight: 100}}>
        <Text style={{padding:15, color: new Date().valueOf() - this.state.ibeaconTimestamp > 10000 ? colors.gray.hex : colors.black.hex, fontSize:12}}>{this.state.ibeaconPayload || "No Data"}</Text>
      </View>
    });
    items.push({label: this.state.ibeaconTimestamp ? "Time received: " + new Date(this.state.ibeaconTimestamp) : "No data yet", type: 'explanation', below: true});

    items.push({label: "Green Background means external state.", type: 'largeExplanation'});

    items.push({label: "Latest Direct Advertisement data:", type: 'largeExplanation'});
    items.push({__item:
        <View style={{backgroundColor: this.state.directAdvertisementStateExternal ? colors.green.rgba(0.1) : colors.white.hex, minHeight: 100}}>
          <Text style={{padding:15, color: new Date().valueOf() - this.state.directAdvertisementTimestamp > 10000 ? colors.gray.hex : colors.black.hex, fontSize:12}}>{this.state.directAdvertisementPayload || "No Data"}</Text>
        </View>
    });
    items.push({label: this.state.directAdvertisementTimestamp ? "Time received: " + new Date(this.state.directAdvertisementTimestamp) : "No data yet", type: 'explanation', below: true});


    items.push({label: "Latest Applied Advertisement data:", type: 'largeExplanation'});
    items.push({__item:
        <View style={{backgroundColor: this.state.advertisementStateExternal ? colors.green.rgba(0.1) : colors.white.hex, minHeight: 100}}>
          <Text style={{padding:15, color: new Date().valueOf() - this.state.advertisementTimestamp > 10000 ? colors.gray.hex : colors.black.hex, fontSize:12}}>{this.state.advertisementPayload || "No Data"}</Text>
        </View>
    });
    items.push({label: this.state.advertisementTimestamp ? "Time received: " + new Date(this.state.advertisementTimestamp) : "No data yet", type: 'explanation', below: true});

    items.push({ type: 'spacer' });

    return items;
  }

  getBuffers(stone, type : PowersampleDataType) {
    BatchCommandHandler.loadPriority(stone, this.props.stoneId, this.props.sphereId, {commandName: 'getPowerSamples', type: type}, {}, 2, "From StoneDebug")
      .then((returnData) => {
        core.eventBus.emit("hideLoading");
        let data : PowerSamples[] = returnData.data;
        LOGe.info("STONE DEBUG INFORMATION: getPowerSamples", type, data);

        let getData = function(buffer: PowerSamples, initialCountValue: number = 0, dataContainer = []) : [number, any[]] {
          let counter = initialCountValue;
          for (let i = 0; i < buffer.samples.length; i++) {
            let convertedValue = buffer.multiplier * (buffer.samples[i] - buffer.offset);
            if (buffer.multiplier == 0) {
              convertedValue = buffer.samples[i];
            }
            dataContainer.push({x: counter, y: convertedValue});
            counter += 1;
          }
          return [counter, dataContainer];
        }

        if (type == "filteredBuffer" || type == "unfilteredBuffer") {
          let voltage = getData(data[0])[1];
          let current = getData(data[1])[1];
          this.setState({debugInformationText: null, debugData1: voltage, debugData2: current, debugTimestamp: returnData.data[0].timestamp, debugDataHash: Math.ceil(Math.random()*1e8).toString(36)});
        }
        else {
          let counter = 0;
          let plotData = [];
          data.forEach((powerSampleSet) => {
            let result = getData(powerSampleSet, counter, plotData)
            counter = result[0];
          })
          this.setState({debugInformationText: null, debugData1: plotData, debugData2:0, debugTimestamp: returnData.data[0].timestamp, debugDataHash: Math.ceil(Math.random()*1e8).toString(36)});
        }
      })
      .catch((err) => {
        core.eventBus.emit("hideLoading");
        Alert.alert("Something went wrong", err, [{text:"Damn."}]);
      })
    BatchCommandHandler.executePriority()
  }

  render() {
    return (
      <BackgroundNoNotification image={core.background.menu} >
        <ScrollView keyboardShouldPersistTaps="always">
          <ListEditableItems items={this._getItems()} separatorIndent={true} />
        </ScrollView>
      </BackgroundNoNotification>
    );
  }
}


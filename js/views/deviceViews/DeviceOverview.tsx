import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceOverview", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Alert,
  ActivityIndicator,
  StyleSheet,
  View
} from 'react-native';

import {colors, availableScreenHeight, } from '../styles'
import { Background } from '../components/Background'
const Swiper = require("react-native-swiper");
import { Util }                 from "../../util/Util";
import { DeviceBehaviour }      from "./elements/DeviceBehaviour";
import { DeviceSummary }        from "./elements/DeviceSummary";
import { DeviceError }          from "./elements/DeviceError";
import { DeviceUpdate }         from "./elements/DeviceUpdate";
import { GuidestoneSummary }    from "./elements/GuidestoneSummary";
import { DevicePowerCurve }     from "./elements/DevicePowerCurve";
import { DeviceSchedule }       from "./elements/DeviceSchedule";
import { BatchCommandHandler }  from "../../logic/BatchCommandHandler";
import { Permissions }          from "../../backgroundProcesses/PermissionManager";
import { MINIMUM_REQUIRED_FIRMWARE_VERSION } from "../../ExternalConfig";
import { SphereDeleted }        from "../static/SphereDeleted";
import { StoneDeleted }         from "../static/StoneDeleted";
import { UsbSummary }           from "./elements/UsbSummary";
import {DeviceActivityLog} from "./elements/DeviceActivityLog";
import { STONE_TYPES } from "../../Enums";
import { core } from "../../core";
import { NavigationUtil } from "../../util/NavigationUtil";
import { xUtil } from "../../util/StandAloneUtil";
import { StoneAvailabilityTracker } from "../../native/advertisements/StoneAvailabilityTracker";
import { TopBarUtil } from "../../util/TopBarUtil";

Swiper.prototype.componentWillUpdate = (nextProps, nextState) => {
  core.eventBus.emit("setNewSwiperIndex", nextState.index);
};

export class DeviceOverview extends LiveComponent<any, any> {
  static options(props) {
    getTopBarProps(core.store, core.store.getState(), props, 0, false);
    return TopBarUtil.getOptions(NAVBAR_PARAMS_CACHE);
  }

  unsubscribeStoreEvents : any;
  unsubscribeSwiperEvents : any = [];
  touchEndTimeout: any;
  summaryIndex : number = 0;
  showWhatsNewVersion : string = null;

  constructor(props) {
    super(props);

    this.state = {swiperIndex: 0, scrolling:false, swipeEnabled: true};
    this.unsubscribeSwiperEvents.push(core.eventBus.on("setNewSwiperIndex", (nextIndex) => {
      if (this.state.swiperIndex !== nextIndex) {
        this.setState({swiperIndex: nextIndex, scrolling: false});
        this._updateNavBar(nextIndex, false);
      }
    }));
    this.unsubscribeSwiperEvents.push(core.eventBus.on("UIGestureControl", (panAvailable) => {
      if (panAvailable === true && this.state.swipeEnabled === false) {
        this.setState({swipeEnabled: true});
      }
      else  if (panAvailable === false && this.state.swipeEnabled === true) {
        // this is used to move the view back if the user swiped it accidentally
        if (this.refs['deviceSwiper']) {
          (this.refs['deviceSwiper'] as any).scrollBy(this.summaryIndex);
        }

        this.setState({swipeEnabled: false});
      }
    }));

    const state = core.store.getState();
    const sphere = state.spheres[this.props.sphereId];
    if (!sphere) { return; }
    const stone = sphere.stones[this.props.stoneId];
    if (!stone) { return; }
    if (stone.config.firmwareVersionSeenInOverview === null) {
      core.store.dispatch({
        type: "UPDATE_STONE_LOCAL_CONFIG",
        sphereId: this.props.sphereId,
        stoneId: this.props.stoneId,
        data: {firmwareVersionSeenInOverview: stone.config.firmwareVersion}
      });
    }
  }

  navigationButtonPressed({ buttonId }) {
    if (buttonId === 'deviceEdit')    {
      NavigationUtil.launchModal( "DeviceEdit",{sphereId: this.props.sphereId, stoneId: this.props.stoneId});
    }
    if (buttonId === 'locked')        {
      Alert.alert(
        lang("_Crownstone_is_Locked___Y_header"),
        lang("_Crownstone_is_Locked___Y_body"),
        [{text:lang("_Crownstone_is_Locked___Y_left")}]);
    }
    if (buttonId === 'behaviourEdit') { NavigationUtil.launchModal( "DeviceBehaviourEdit",{sphereId: this.props.sphereId, stoneId: this.props.stoneId});  }
  }

  componentDidMount() {
    let state = core.store.getState();
    if (state.app.hasSeenDeviceSettings === false) {
      core.store.dispatch({type: 'UPDATE_APP_SETTINGS', data: {hasSeenDeviceSettings: true}})
    }

    // tell the component exactly when it should redraw
    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      let state = core.store.getState();
      if (
        (state.spheres[this.props.sphereId] === undefined) ||
        (change.removeSphere && change.removeSphere.sphereIds[this.props.sphereId]) ||
        (change.removeStone  && change.removeStone.stoneIds[this.props.stoneId])
       ) {
        return this.forceUpdate();
      }

      let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];

      if (!stone || !stone.config) {
        return this.forceUpdate();
      }

      let applianceId = stone.config.applianceId;
      if (
        change.changeAppSettings ||
        change.updateStoneConfig && change.updateStoneConfig.stoneIds[this.props.stoneId] ||
        applianceId && change.updateApplianceConfig && change.updateApplianceConfig.applianceIds[applianceId]
        ) {
          this._updateNavBar(this.state.swiperIndex, false);
        }
    });
  }

  componentWillUpdate(nextProps, nextState) {
    if (nextState.swiperIndex !== this.summaryIndex) {
      // This will close the connection that is kept open by a dimming command. Dimming is the only command that keeps the connection open.
      // If there is no connection being kept open, this command will not do anything.
      BatchCommandHandler.closeKeptOpenConnection();
    }
  }

  componentWillUnmount() {
    this.unsubscribeStoreEvents();
    this.unsubscribeSwiperEvents.forEach((unsubscribe) => { unsubscribe(); });
    clearTimeout(this.touchEndTimeout);
    // This will close the connection that is kept open by a dimming command. Dimming is the only command that keeps the connection open.
    // If there is no connection being kept open, this command will not do anything.
    BatchCommandHandler.closeKeptOpenConnection();

    const state = core.store.getState();
    const sphere = state.spheres[this.props.sphereId];
    if (sphere) {
      const stone = sphere.stones[this.props.stoneId];
      if (stone && stone.config.firmwareVersionSeenInOverview !== stone.config.firmwareVersion) {
        core.store.dispatch({
          type: "UPDATE_STONE_LOCAL_CONFIG",
          sphereId: this.props.sphereId,
          stoneId: this.props.stoneId,
          data: {firmwareVersionSeenInOverview: stone.config.firmwareVersion}
        });
      }
    }

    NAVBAR_PARAMS_CACHE = null;

  }

  _updateNavBar(swiperIndex, scrolling) {
    let state = core.store.getState();
    getTopBarProps(core.store, state, this.props, swiperIndex, scrolling);
    TopBarUtil.replaceOptions(this.props.componentId, NAVBAR_PARAMS_CACHE)
  }


  render() {
    const state = core.store.getState();
    const sphere = state.spheres[this.props.sphereId];
    if (!sphere) { return <SphereDeleted /> }
    const stone = sphere.stones[this.props.stoneId];
    if (!stone) { return <StoneDeleted /> }
    let summaryIndex = 0;
    this.summaryIndex = summaryIndex;

    // check what we want to show the user:
    let hasError        = stone.errors.hasError;
    let mustUpdate      = xUtil.versions.canIUse(stone.config.firmwareVersion, MINIMUM_REQUIRED_FIRMWARE_VERSION) === false;
    let canUpdate       = Permissions.inSphere(this.props.sphereId).canUpdateCrownstone && xUtil.versions.canUpdate(stone, state) && StoneAvailabilityTracker.isDisabled(this.props.stoneId) === false;
    let hasBehaviour    = stone.config.type === STONE_TYPES.plug || stone.config.type === STONE_TYPES.builtin || stone.config.type === STONE_TYPES.builtinOne;
    let hasPowerMonitor = stone.config.type === STONE_TYPES.plug || stone.config.type === STONE_TYPES.builtin || stone.config.type === STONE_TYPES.builtinOne;
    let hasScheduler    = stone.config.type === STONE_TYPES.plug || stone.config.type === STONE_TYPES.builtin || stone.config.type === STONE_TYPES.builtinOne;
    let hasActivityLog  = stone.config.type === STONE_TYPES.plug || stone.config.type === STONE_TYPES.builtin || stone.config.type === STONE_TYPES.builtinOne;
    let deviceType      = stone.config.type;

    // if this stone requires to be dfu-ed to continue working, block all other actions.
    if (stone.config.dfuResetRequired) {
      canUpdate       = true;
      hasError        = false;
      hasBehaviour    = false;
      hasPowerMonitor = false;
      hasScheduler    = false;
    }

    let checkScrolling = (newState) => {
      if (this.state.scrolling !== newState) {
        this._updateNavBar(this.state.swiperIndex, newState);
        this.setState({scrolling: newState});
      }
    };

    let content = this._getContent(hasError, canUpdate, mustUpdate, hasBehaviour, hasPowerMonitor, hasScheduler, hasActivityLog, deviceType, stone.config);
    return (
      <Background image={core.background.detailsDark}>
        { content.length > 1 ? <Swiper
          style={swiperStyles.wrapper}
          showsPagination={true}
          height={availableScreenHeight}
          ref="deviceSwiper"
          dot={<View style={{backgroundColor: colors.white.rgba(0.35), width: 8, height: 8,borderRadius: 4, marginLeft: 3, marginRight: 3, marginTop: 3, marginBottom: 3, borderWidth:1, borderColor: colors.black.rgba(0.1)}} />}
          activeDot={<View style={{backgroundColor: colors.white.rgba(1), width: 9, height: 9, borderRadius: 4.5, marginLeft: 3, marginRight: 3, marginTop: 3, marginBottom: 3, borderWidth:1, borderColor: colors.csOrange.rgba(1)}} />}
          loop={false}
          scrollEnabled={this.state.swipeEnabled}
          bounces={true}
          loadMinimal={true}
          loadMinimalSize={2}
          onScrollBeginDrag={ () => { checkScrolling(true);  }}
          onTouchEnd={() => { this.touchEndTimeout = setTimeout(() => { checkScrolling(false); }, 400);  }}
        >
          { content }
        </Swiper> : content }
      </Background>
    )
  }


  _getContent(
    hasError, canUpdate, mustUpdate, hasBehaviour, hasPowerMonitor, hasScheduler, hasActivityLog,
    deviceType, stoneConfig) {
    let content = [];
    let props = {sphereId: this.props.sphereId, stoneId: this.props.stoneId};

    if (hasError) {
      content.push(<DeviceError key={'errorSlide'} {...props} />);
      return content;
    }

    if (mustUpdate) {
      content.push(<DeviceUpdate key={'updateSlide'} mandatory={true} {...props} />);
      return content;
    }

    if (canUpdate) {
      content.push(<DeviceUpdate key={'updateSlide'} mandatory={false} canUpdate={canUpdate} {...props} />);
    }

    if (stoneConfig.dfuResetRequired) {
      return content;
    }

    if (deviceType === STONE_TYPES.guidestone) {
      content.push(<GuidestoneSummary key={'summarySlide'}  {...props} />);
    }
    else if (deviceType === STONE_TYPES.crownstoneUSB) {
      content.push(<UsbSummary key={'summarySlide'}  {...props} />);
    }
    else {
      content.push(<DeviceSummary key={'summarySlide'}  {...props} />);
    }

    if (hasBehaviour) {
      content.push(<DeviceBehaviour key={'behaviourSlide'} {...props} />);
    }

    if (hasScheduler) {
      content.push(<DeviceSchedule key={'scheduleSlide'} {...props} />);
    }

    if (hasActivityLog) {
      content.push(<DeviceActivityLog key={'activityLogSlide'} {...props} />);
    }

    if (hasPowerMonitor) {
      content.push(<DevicePowerCurve key={'powerSlide'} {...props} />);
    }


    return content;
  }
}


function getTopBarProps(store, state, props, swiperIndex, scrolling) {
  const stone = state.spheres[props.sphereId].stones[props.stoneId];
  const element = Util.data.getElement(store, props.sphereId, props.stoneId, stone);

  let hasAppliance = stone.config.applianceId !== null;
  let summaryIndex = 0;
  let behaviourIndex = summaryIndex + 1;

  let spherePermissions = Permissions.inSphere(props.sphereId);

  // check what we want to show the user:
  let hasError   = stone.errors.hasError;
  let mustUpdate = xUtil.versions.canIUse(stone.config.firmwareVersion, MINIMUM_REQUIRED_FIRMWARE_VERSION) === false;
  let canUpdate  = Permissions.inSphere(props.sphereId).canUpdateCrownstone && xUtil.versions.canUpdate(stone, state) && StoneAvailabilityTracker.isDisabled(props.stoneId) === false;

  // only shift the indexes (move the edit button to the next pages) if we do not have a mandatory view
  if (!hasError && !mustUpdate) {
    if (canUpdate) { summaryIndex++; behaviourIndex++; }
  }

  // if this stone requires to be dfu-ed to continue working, block all other actions.
  if (stone.config.dfuResetRequired) {
    summaryIndex = 0;
  }

  let rightLabel = null;
  let rightId  = null;
  switch (swiperIndex) {
    case summaryIndex:
      if (hasAppliance ? spherePermissions.editAppliance : spherePermissions.editCrownstone) {
        rightLabel =  lang("Edit");
        rightId = 'deviceEdit';
      }
      break;
    case behaviourIndex:
      if (spherePermissions.changeBehaviour && state.app.indoorLocalizationEnabled) {
        rightLabel =  lang("Change");
        if (stone.config.locked === true) {
          rightId = 'locked';
        }
        else {
          rightId = 'behaviourEdit';
        }
      }
      break;
  }

  if (scrolling) {
    NAVBAR_PARAMS_CACHE = {
      title: element.config.name,
      rightLoading: true,
    };
  }
  else if (rightId === null) {
    NAVBAR_PARAMS_CACHE = {
      title: element.config.name,
    };
  }
  else {
    NAVBAR_PARAMS_CACHE = {
      title: element.config.name,
      nav: {
        id: rightId,
        text: rightLabel,
      },
    };
  }

  return NAVBAR_PARAMS_CACHE;
}

let NAVBAR_PARAMS_CACHE : topbarOptions = null;


let swiperStyles = StyleSheet.create({
  wrapper: {
  },
  slide1: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slide2: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slide3: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  }
});

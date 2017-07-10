import * as React from 'react'; import { Component } from 'react';
import {
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  PixelRatio,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  Text,
  View
} from 'react-native';
const Actions = require('react-native-router-flux').Actions;

import {styles, colors, screenWidth, screenHeight, availableScreenHeight} from '../../styles'
import { LOG } from '../../../logging/Log'
import {Util} from "../../../util/Util";
import {Icon} from "../../components/Icon";
import {StoneUtil} from "../../../util/StoneUtil";
import {enoughCrownstonesInLocationsForIndoorLocalization} from "../../../util/DataUtil";
import {BEHAVIOUR_TYPES} from "../../../router/store/reducers/stones";
import {Permissions} from "../../../backgroundProcesses/Permissions";


let DISABLED_COLOR = colors.gray.hex;
let WARNING_COLOR = colors.csOrange.hex;

export class DeviceBehaviour extends Component<any, any> {
  constructor() {
    super();
  }

  getWarning(state, nearFarDisabled) {
    let warnings = [];
    if (state.app.indoorLocalizationEnabled === false) {
      return (
        <TouchableOpacity
          key="heartbeatWarning"
          style={{flexDirection: 'row'}}
          onPress={() => { Actions.settingsApp(); }}
        >
          <Text style={textStyle.warning}>{'Behaviour is disabled in the App Settings. Re-enable indoor localization to use the behaviour.'}</Text>
        </TouchableOpacity>
      );
    }

    if (state.app.keepAlivesEnabled === false) {
      warnings.push(
        <TouchableOpacity
          key="heartbeatWarning"
          style={{flexDirection: 'row'}}
          onPress={() => { Actions.settingsApp(); }}
        >
          <Text style={textStyle.warning}>{'Heartbeat is disabled in the App Settings. Re-enable the Heartbeat to use the exit behaviour.'}</Text>
        </TouchableOpacity>
      );
    }


    if (nearFarDisabled) {
      warnings.push(
        <TouchableOpacity
          key="nearFarWarning"
          style={{flexDirection: 'row'}}
          onPress={() => {Actions.deviceBehaviourEdit({sphereId: this.props.sphereId, stoneId: this.props.stoneId});}}
        >
          <Text style={textStyle.warning}>{'Near/away is disabled until you define where near is. Press change at the top to do this now.'}</Text>
        </TouchableOpacity>
      );
    }

    return warnings;
  }

  render() {
    const store = this.props.store;
    const state = store.getState();
    const sphere = state.spheres[this.props.sphereId];
    const stone = sphere.stones[this.props.stoneId];
    const element = Util.data.getElement(sphere, stone);

    let canChangeBehaviour = Permissions.changeBehaviour && state.app.indoorLocalizationEnabled;

    let canDoIndoorLocalization = enoughCrownstonesInLocationsForIndoorLocalization(state, this.props.sphereId) && stone.config.locationId !== null;
    let nearFarDisabled = canDoIndoorLocalization === false && stone.config.nearThreshold === null && element.behaviour.onAway.active === true && element.behaviour.onNear.active === true;

    return (
      <View style={{flex:1, flexDirection: 'column', alignItems:'center'}}>
        <View style={{flex: 1.5}} />
        <Text style={textStyle.title}>Behaviour</Text>
        <Text style={textStyle.explanation}>This is how I respond to your location:</Text>
        <View style={{flex: 1.5}} />
        <BehaviourResponse data={element.behaviour} type={BEHAVIOUR_TYPES.HOME_ENTER} stone={stone} appSettings={state.app} canChangeBehaviour={canChangeBehaviour} sphereId={this.props.sphereId} stoneId={this.props.stoneId} />
        <View style={{flex:0.8}} />
        <BehaviourResponse data={element.behaviour} type={BEHAVIOUR_TYPES.HOME_EXIT}  stone={stone} sphere={sphere} appSettings={state.app} canChangeBehaviour={canChangeBehaviour} sphereId={this.props.sphereId} stoneId={this.props.stoneId}  />
        <View style={{flex:0.8}} />
        {
          canDoIndoorLocalization ?
          <BehaviourResponse data={element.behaviour} stone={stone} type={BEHAVIOUR_TYPES.ROOM_ENTER} appSettings={state.app} canChangeBehaviour={canChangeBehaviour} sphereId={this.props.sphereId} stoneId={this.props.stoneId}  /> :
          <BehaviourResponse data={element.behaviour} stone={stone} type={BEHAVIOUR_TYPES.NEAR}       appSettings={state.app} canChangeBehaviour={canChangeBehaviour} sphereId={this.props.sphereId} stoneId={this.props.stoneId}  />
        }
        <View style={{flex:0.8}} />
        {
          canDoIndoorLocalization ?
          <BehaviourResponse data={element.behaviour} stone={stone} type={BEHAVIOUR_TYPES.ROOM_EXIT} appSettings={state.app} canChangeBehaviour={canChangeBehaviour} sphereId={this.props.sphereId} stoneId={this.props.stoneId}  /> :
          <BehaviourResponse data={element.behaviour} stone={stone} type={BEHAVIOUR_TYPES.AWAY}      appSettings={state.app} canChangeBehaviour={canChangeBehaviour} sphereId={this.props.sphereId} stoneId={this.props.stoneId}  />
        }
        <View style={{flex: 2}} />
        { this.getWarning(state, nearFarDisabled) }
        <View style={{flex: 2}} />
        { element.config.onlyOnWhenDark === true && state.app.indoorLocalizationEnabled ?
        <TouchableOpacity style={{flexDirection: 'row'}} onPress={() => {
          Actions.deviceBehaviourEdit({sphereId: this.props.sphereId, stoneId: this.props.stoneId});
        }}>
          <Text style={textStyle.value}>I will </Text>
          <Text style={[textStyle.value,{fontStyle: 'italic'}]}>only </Text>
          <Text style={[textStyle.value,{color: colors.green.hex}]}> TURN ON</Text>
          <Text style={textStyle.value}> if it is dark outside.</Text>
        </TouchableOpacity> : undefined }
        <View style={{flex:2}} />
        <View style={{height:30, width: screenWidth, backgroundColor:'transparent'}} />
      </View>
    )
  }
}

class BehaviourResponse extends Component<any, any> {
  _getDelay() {
    let delay = this.props.data[this.props.type].delay;
    if (this.props.type === 'onHomeExit' && this.props.sphere) {
      delay = this.props.sphere.config.exitDelay;
    }
    if (delay === 0) { return; }
    return ' after ' + Util.getDelayLabel(delay, true);
  }

  _getValue(responseStyle) {
    if (this.props.data[this.props.type].state > 0) {
      return <Text style={[textStyle.value,responseStyle]}>TURN ON</Text>
    }
    else {
      return <Text style={[textStyle.value,responseStyle]}>TURN OFF</Text>
    }
  }

  _getTitle() {
    switch (this.props.type) {
      case 'onHomeEnter':
        return 'When you enter the Sphere';
      case 'onHomeExit':
        return 'When you leave the Sphere';
      case 'onRoomEnter':
        return 'When you enter the Room';
      case 'onRoomExit':
        return 'When you leave the Room';
      case 'onNear':
        return 'When you get near to Me';
      case 'onAway':
        return 'When you move away from Me';
      default:
        return "UNKNOWN TYPE:" + this.props.type
    }
  }

  _getResponseStyle(isDisabled: boolean, active : boolean) {
    if (isDisabled) {
      return {color: DISABLED_COLOR, textDecorationLine:'line-through'};
    }

    if ((this.props.type === 'onNear' || this.props.type === 'onAway') && this.props.stone.config.nearThreshold === null && active) {
      return {color: WARNING_COLOR};
    }

    return {color: colors.white.hex};
  }

  _isDisabled() {
    if (this.props.appSettings.indoorLocalizationEnabled === false) {
      return true;
    }

    if (this.props.appSettings.keepAlivesEnabled === false && (this.props.type === BEHAVIOUR_TYPES.HOME_EXIT || this.props.type === BEHAVIOUR_TYPES.ROOM_EXIT)) {
      return true;
    }

    return false;
  }

  render() {
    let type = this.props.type;
    let active = this.props.data[type].active;
    let isDisabled = this._isDisabled();
    let responseStyle = this._getResponseStyle(isDisabled, active);

    let content;
    if (active) {
      content = (
        <View>
          <Text style={[textStyle.case, responseStyle]}>{this._getTitle()}</Text>
          <View style={{flexDirection: 'row', alignItems:'center', justifyContent:'center'}}>
            {this.props.prefixItem ? this.props.prefixItem :   <Text style={[textStyle.value, responseStyle]}>{this.props.prefix || 'I will '}</Text>}
            {this._getValue(responseStyle)}
            {this.props.postfixItem ? this.props.postfixItem : <Text style={[textStyle.value, responseStyle]}>{this._getDelay()}</Text>}
          </View>
        </View>
      );
    }
    else {
      content = (
        <View>
          <Text style={[textStyle.case, responseStyle]}>{this._getTitle()}</Text>
          <Text style={[textStyle.value, {color: colors.white.rgba(0.4), fontWeight:'400', fontStyle:'italic'}, responseStyle]}>{"I won't do anything..."}</Text>
        </View>
      );
    }

    if (isDisabled) {
      return (
        <View style={{alignItems:'center'}}>
          {content}
        </View>
      );
    }
    else {
      return (
        <TouchableOpacity style={{alignItems:'center'}} onPress={() => {
          Actions.deviceBehaviourEdit({sphereId: this.props.sphereId, stoneId: this.props.stoneId});
        }}>
          {content}
        </TouchableOpacity>
      );
    }
  }
}

export const textStyle = StyleSheet.create({
  title: {
    color:colors.white.hex,
    fontSize:30,
    paddingBottom:10,
    fontWeight:'bold'
  },
  explanation: {
    color:colors.white.hex,
    width:screenWidth,
    textAlign:'center',
    fontSize:13,
    padding:5,
    paddingLeft:15,
    paddingRight:15,
    fontWeight:'400'
  },
  case: {
    color:colors.white.hex,
    width:screenWidth,
    textAlign:'center',
    fontSize:13,
    padding:5,
    fontWeight:'400',
  },
  value: {
    color:colors.white.hex,
    textAlign:'center',
    fontSize:15,
    fontWeight:'600'
  },
  specification: {
    color:colors.white.hex,
    width:screenWidth,
    textAlign:'center',
    fontSize:15,
    padding:15,
    fontWeight:'600'
  },
  warning: {
    color: WARNING_COLOR,
    width:screenWidth,
    textAlign:'center',
    fontStyle:'italic',
    fontSize:13,
    padding:15,
    fontWeight:'600'
  }

});